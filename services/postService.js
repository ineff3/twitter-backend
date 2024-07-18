import { BaseError, NotFoundError } from '../shared/BaseError.js'
import { deleteImageFromBucket } from '../shared/s3/s3BucketActions.js'
import { uploadFilesArray } from '../shared/s3Uploads/uploadMultiple.js'
import mongoose from 'mongoose'

export class PostService {
	#S3_IMAGE_FOLDER = 'posts'
	constructor(PostModel, UserModel, maxPostsPerUser = 10) {
		this.PostModel = PostModel
		this.UserModel = UserModel
		this.maxPostsPerUser = maxPostsPerUser
	}

	async createPost(userId, text, files) {
		const userPostsCount = await this.PostModel.countDocuments({
			author: userId,
		})
		if (userPostsCount >= this.maxPostsPerUser) {
			throw new BaseError(
				'BAD_REQUEST',
				400,
				'Post limit per user reached'
			)
		}

		let postFiles = await uploadFilesArray(files, this.#S3_IMAGE_FOLDER)

		const createdPost = await this.PostModel.create({
			_id: new mongoose.Types.ObjectId(),
			author: userId,
			text: text,
			postImages: postFiles.map(
				(file) => `${this.#S3_IMAGE_FOLDER}/${file.newName}`
			),
			isLiked: false,
			likedBy: [],
		})
		const populatedPost = await this.PostModel.findById(
			createdPost._id
		).populate({
			path: 'author',
			select: 'firstName secondName username userImage',
		})
		return { ...populatedPost.toObject(), likedBy: 0 }
	}

	async deletePost(userId, postId) {
		const session = await mongoose.startSession()
		session.startTransaction()
		try {
			const post = await this.PostModel.findById(postId)
			if (!post) {
				throw new NotFoundError('Post')
			}
			if (userId !== post.author._id.toString()) {
				throw new BaseError(
					'FORBIDDEN_ERROR',
					403,
					'Access denied. The user id and post author id are different'
				)
			}
			await this.UserModel.updateMany(
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

			await this.PostModel.findByIdAndDelete(postId)
				.session(session)
				.exec()
			await session.commitTransaction()
		} catch (err) {
			await session.abortTransaction()
			throw err
		} finally {
			session.endSession()
		}
	}

	async getPosts(userId, query) {
		const { bookmarked, liked, limit = 10, page = 1 } = query
		const paginationLimit = parseInt(limit)
		const paginationPage = parseInt(page)
		const skip = (paginationPage - 1) * paginationLimit

		if (bookmarked === 'true' && liked === 'true') {
			throw new BaseError('SERVER_ERROR', 500, 'Logic not implemented')
		}

		if (liked === 'true') {
			return this.getLikedPosts(userId, paginationLimit, skip)
		}

		if (bookmarked === 'true') {
			return this.getBookmarkedPosts(userId, paginationLimit, skip)
		}

		return this.getAllPosts(userId, paginationLimit, skip)
	}
	async getAllPosts(userId, limit, skip) {
		const [posts, totalCount] = await Promise.all([
			this.PostModel.find()
				.sort({ createdAt: -1 })
				.populate({
					path: 'author',
					select: '_id firstName secondName username userImage',
				})
				.limit(limit)
				.skip(skip),
			this.PostModel.countDocuments(),
		])

		const user = await this.UserModel.findById(userId)
		const updatedPosts = posts.map((post) => post.refactorPost(user))

		return { posts: updatedPosts, totalCount }
	}
	async getLikedPosts(userId, limit, skip) {
		const user = await this.UserModel.findById(userId)
		if (!user) {
			throw new NotFoundError(404, 'User')
		}

		const [posts, totalCount] = await Promise.all([
			this.PostModel.find({ likedBy: userId })
				.sort({ createdAt: -1 })
				.populate({
					path: 'author',
					select: '_id firstName secondName username userImage',
				})
				.limit(limit)
				.skip(skip),
			this.PostModel.countDocuments({ likedBy: userId }),
		])
		const updatedPosts = posts.map((post) => post.refactorPost(user))
		return { posts: updatedPosts, totalCount }
	}
	async getBookmarkedPosts(userId, limit, skip) {
		const user = await this.UserModel.findById(userId).populate({
			path: 'bookmarks',
			populate: {
				path: 'author',
				select: '_id firstName secondName username userImage',
			},
			options: { limit, skip },
		})

		if (!user) {
			throw new NotFoundError('User')
		}

		const refactoredBookmarks = user.bookmarks.map((post) =>
			post.refactorPost(user)
		)
		const totalCount = await this.UserModel.countDocuments({
			bookmarks: userId,
		})
		console.log(refactoredBookmarks)

		return { posts: refactoredBookmarks, totalCount }
	}
	async getUserPosts(userId, limit, skip) {
		const [posts, totalCount] = await Promise.all([
			this.PostModel.find({ author: userId })
				.sort({ createdAt: -1 })
				.populate({
					path: 'author',
					select: '_id firstName secondName username userImage',
				})
				.limit(limit)
				.skip(skip),
			this.PostModel.countDocuments({ author: userId }),
		])

		const user = await this.UserModel.findById(userId)
		const updatedPosts = posts.map((post) => post.refactorPost(user))

		return { posts: updatedPosts, totalCount }
	}
	async likePost(postId, userId) {
		const post = await this.PostModel.findById(postId)
		if (!post) {
			throw new NotFoundError('Post')
		}
		const postWasLiked = post.likedBy.indexOf(userId)
		if (postWasLiked == -1) {
			post.likedBy.push(userId)
		} else {
			post.likedBy.splice(postWasLiked, 1)
		}
		await post.save()
	}
	async bookmarkPost(postId, userId) {
		const post = await this.PostModel.findById(postId)
		if (!post) {
			throw new NotFoundError('Post')
		}
		const user = await this.UserModel.findById(userId)
		const bookmarkedPostIndex = user.bookmarks.indexOf(postId)
		if (bookmarkedPostIndex != -1) {
			user.bookmarks.splice(bookmarkedPostIndex, 1)
		} else {
			user.bookmarks.push(postId)
		}
		await user.save()
	}
}
