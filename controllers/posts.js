import mongoose from 'mongoose'
import PostModel from '../models/post.js'
import ServerError from '../utils/server-error.js'

const PostController = {
	//requires image middleware
	createPost: async (req, res, next) => {
		try {
			console.log(req.files)
			if (!req.body.text && !req.files) {
				throw new ServerError(
					404,
					'Neither post text nor image provided!'
				)
			}
			const createdPost = await PostModel.create({
				_id: new mongoose.Types.ObjectId(),
				author: req.userId,
				dateCreated: new Date().toISOString(),
				text: req.body.text,
				postImages: req.files.map((file) => file.path),
			})
			const populatedPost = await PostModel.findById(createdPost._id)
				.populate({
					path: 'author',
					select: 'firstName secondName username userImage',
				})
				.exec()

			res.status(201).json(populatedPost)
		} catch (err) {
			next(err)
		}
	},
	getAllPosts: async (req, res, next) => {
		try {
			const posts = await PostModel.find()
				.populate({
					path: 'author',
					select: 'firstName secondName username userImage',
				})
				.exec()
			res.status(200).json(posts)
		} catch (err) {
			next(err)
		}
	},
}

export default PostController
