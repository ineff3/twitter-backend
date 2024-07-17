import { PostService } from '../services/postService.js'
import { PostModel } from '../models/post.js'
import { UserModel } from '../models/user.js'
import { NotFoundError } from '../shared/BaseError.js'

const postServiceInstance = new PostService(PostModel, UserModel)
export const PostController = {
	async createPost(req, res, next) {
		if (!req.body.text && !req.files) {
			throw new NotFoundError('Neither post text nor image')
		}
		try {
			const newPost = await postServiceInstance.createPost(
				req.userId,
				req.body.text,
				req.files
			)
			res.status(201).json(newPost)
		} catch (err) {
			next(err)
		}
	},
	async deletePost(req, res, next) {
		const { postId } = req.params
		try {
			await postServiceInstance.deletePost(req.userId, postId)
			res.sendStatus(204)
		} catch (err) {
			next(err)
		}
	},
	async getPosts(req, res, next) {
		try {
			const { userId, query } = req
			const { posts, totalCount } = await postServiceInstance.getPosts(
				userId,
				query
			)

			const paginationLimit = parseInt(query.limit) || 10
			const paginationPage = parseInt(query.page) || 1
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
	async getUserPosts(req, res, next) {
		const { userId } = req.params
		const { limit, page } = req.query
		try {
			const paginationLimit = parseInt(limit) || 10
			const paginationPage = parseInt(page) || 1
			const skip = (paginationPage - 1) * paginationLimit

			const { posts, totalCount } =
				await postServiceInstance.getUserPosts(
					userId,
					paginationLimit,
					skip
				)

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
