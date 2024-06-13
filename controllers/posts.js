import mongoose from 'mongoose'
import PostModel from '../models/post.js'
import UserModel from '../models/user.js'
import ServerError from '../utils/serverError.js'

import { getUserPostsCount } from '../services/userService.js'
import { getAllPosts, getBookmarkedPosts } from '../services/postService.js'

const MAX_POSTS_PER_USER = 10

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
			const createdPost = await PostModel.create({
				_id: new mongoose.Types.ObjectId(),
				author: req.userId,
				text: req.body.text,
				postImages: req.files.map((file) => file.path),
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
			const { bookmarked, limit, page } = req.query
			const userId = req.userId

			const paginationLimit = parseInt(limit) || 10
			const paginationPage = parseInt(page) || 1
			const skip = (paginationPage - 1) * paginationLimit

			let posts = []
			let totalCount = 0
			if (bookmarked === 'true') {
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
}

export default PostController
