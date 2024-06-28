import mongoose from 'mongoose'
import PostModel from '../models/post.js'
import UserModel from '../models/user.js'
import ServerError from '../utils/serverError.js'

import { getUserPostsCount } from '../services/userService.js'
import {
	getAllPosts,
	getBookmarkedPosts,
	getLikedPosts,
} from '../services/postService.js'
import { deleteImageFromBucket } from '../utils/s3BucketUtils.js'
import uploadFilesArray from '../utils/files/uploadFilesArray.js'

const MAX_POSTS_PER_USER = 10
const S3_IMAGE_FOLDER = 'posts'

const PostController = {
	createPost: async (req, res, next) => {
		try {
			const userPostsCount = await getUserPostsCount(req.userId)
			if (userPostsCount >= MAX_POSTS_PER_USER) {
				throw new ServerError(400, 'User posts limit reached')
			}

			if (!req.body.text && !req.files) {
				throw new ServerError(
					404,
					'Neither post text nor image provided!'
				)
			}
			let postFiles = await uploadFilesArray(req.files, S3_IMAGE_FOLDER)

			const createdPost = await PostModel.create({
				_id: new mongoose.Types.ObjectId(),
				author: req.userId,
				text: req.body.text,
				postImages: postFiles.map(
					(file) => `${S3_IMAGE_FOLDER}/${file.newName}`
				),
				isLiked: false,
				likedBy: [],
			})
			const populatedPost = await PostModel.findById(createdPost._id)
				.populate({
					path: 'author',
					select: 'firstName secondName username userImage',
				})
				.exec()
			res.status(201).json({ ...populatedPost.toObject(), likedBy: 0 })
		} catch (err) {
			next(err)
		}
	},
	likePost: async (req, res, next) => {
		const postId = req.body.postId
		try {
			if (!postId) {
				throw new ServerError(404, 'postId is required')
			}
			const post = await PostModel.findById(postId).exec()
			if (!post) {
				throw new ServerError(404, 'Post with such id does not found')
			}
			const postWasLiked = post.likedBy.indexOf(req.userId)
			if (postWasLiked == -1) {
				post.likedBy.push(req.userId)
			} else {
				post.likedBy.splice(postWasLiked, 1)
			}
			await post.save()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
	bookmarkPost: async (req, res, next) => {
		const postId = req.body.postId
		try {
			if (!postId) {
				throw new ServerError(404, 'postId is required')
			}
			const post = await PostModel.findById(postId)
			if (!post) {
				throw new ServerError(404, 'Post with such id does not found')
			}
			const user = await UserModel.findById(req.userId).exec()
			const bookmarkedPostIndex = user.bookmarks.indexOf(postId)
			if (bookmarkedPostIndex != -1) {
				user.bookmarks.splice(bookmarkedPostIndex, 1)
			} else {
				user.bookmarks.push(postId)
			}
			await user.save()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
	getPosts: async (req, res, next) => {
		try {
			const { bookmarked, liked, limit, page } = req.query
			const userId = req.userId

			const paginationLimit = parseInt(limit) || 10
			const paginationPage = parseInt(page) || 1
			const skip = (paginationPage - 1) * paginationLimit

			let posts = []
			let totalCount = 0
			if (bookmarked === 'true' && liked === 'true') {
				throw new ServerError(500, 'Logic not implemented')
			} else if (liked === 'true') {
				;({ posts, totalCount } = await getLikedPosts(
					userId,
					paginationLimit,
					skip
				))
			} else if (bookmarked === 'true') {
				;({ posts, totalCount } = await getBookmarkedPosts(
					userId,
					paginationLimit,
					skip
				))
			} else {
				;({ posts, totalCount } = await getAllPosts(
					userId,
					paginationLimit,
					skip
				))
			}

			const totalPages = Math.ceil(totalCount / paginationLimit)
			const nextPage =
				paginationPage < totalPages ? paginationPage + 1 : null

			res.status(200).json({
				data: posts,
				nextPage,
				totalPages,
			})
		} catch (err) {
			next(err)
		}
	},
	getUserPosts: async (req, res, next) => {
		try {
			const { userId } = req.params
			const { limit, page } = req.query

			const paginationLimit = parseInt(limit) || 10
			const paginationPage = parseInt(page) || 1
			const skip = (paginationPage - 1) * paginationLimit

			const [posts, totalCount] = await Promise.all([
				PostModel.find({ author: userId })
					.sort({ createdAt: -1 })
					.populate({
						path: 'author',
						select: '_id firstName secondName username userImage',
					})
					.limit(paginationLimit)
					.skip(skip)
					.exec(),
				PostModel.countDocuments({ author: userId }).exec(),
			])

			const totalPages = Math.ceil(totalCount / paginationLimit)
			const nextPage =
				paginationPage < totalPages ? paginationPage + 1 : null

			const user = await UserModel.findById(req.userId).exec()
			const updatedPosts = posts.map((post) => post.refactorPost(user))

			res.status(200).json({
				data: updatedPosts,
				nextPage,
				totalPages,
			})
		} catch (err) {
			next(err)
		}
	},
	deletePost: async (req, res, next) => {
		const session = await mongoose.startSession()
		session.startTransaction()
		try {
			const postId = req.params.postId
			const post = await PostModel.findById(postId).exec()
			if (!post) {
				throw new ServerError(404, 'Post was not found')
			}
			if (req.userId !== post.author._id.toString()) {
				throw new ServerError(
					403,
					'Access denied. The user id and post author id are different'
				)
			}

			await UserModel.updateMany(
				{ bookmarks: postId },
				{ $pull: { bookmarks: postId } }
			).session(session)

			const { postImages } = post
			if (postImages && postImages.length > 0) {
				await Promise.all(
					postImages.map(async (imagePath) => {
						await deleteImageFromBucket(imagePath)
					})
				)
			}

			await PostModel.findByIdAndDelete(postId).session(session).exec()
			await session.commitTransaction()
			res.sendStatus(200)
		} catch (err) {
			await session.abortTransaction()
			next(err)
		} finally {
			session.endSession()
		}
	},
}

export default PostController
