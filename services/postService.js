import UserModel from '../models/user.js'
import PostModel from '../models/post.js'
import sharp from 'sharp'
import { uploadImageToBucket } from '../utils/s3BucketUtils.js'

export const getAllPosts = async (userId, limit, skip) => {
	const [posts, totalCount] = await Promise.all([
		PostModel.find()
			.sort({ createdAt: -1 })
			.populate({
				path: 'author',
				select: '_id firstName secondName username userImage',
			})
			.limit(limit)
			.skip(skip)
			.exec(),
		PostModel.countDocuments().exec(),
	])

	const user = await UserModel.findById(userId).exec()
	const updatedPosts = posts.map((post) => post.refactorPost(user))

	return { posts: updatedPosts, totalCount }
}

export const getLikedPosts = async (userId, limit, skip) => {
	const user = await UserModel.findById(userId).exec()
	if (!user) {
		throw new Error('User not found')
	}

	const [posts, totalCount] = await Promise.all([
		PostModel.find({ likedBy: userId })
			.sort({ createdAt: -1 })
			.populate({
				path: 'author',
				select: '_id firstName secondName username userImage',
			})
			.limit(limit)
			.skip(skip)
			.exec(),
		PostModel.countDocuments({ likedBy: userId }).exec(),
	])
	const updatedPosts = posts.map((post) => post.refactorPost(user))
	return { posts: updatedPosts, totalCount }
}

export const getBookmarkedPosts = async (userId, limit, skip) => {
	const userInitial = await UserModel.findById(userId).exec()
	const user = await UserModel.findById(userId)
		.populate({
			path: 'bookmarks',
			populate: {
				path: 'author',
				select: '_id firstName secondName username userImage',
			},
			options: { limit, skip },
		})
		.exec()

	const refactoredBookmarks = user.bookmarks.map((post) =>
		post.refactorPost(userInitial)
	)
	const totalCount = userInitial.bookmarks.length

	return { posts: refactoredBookmarks, totalCount }
}
export const uploadPostImage = async (buffer, imageName, folder) => {
	if (!buffer || !imageName) {
		throw new ServerError(404, 'Invalid params for post image uploading')
	}

	const sharpedBuffer = await sharp(buffer).toFormat('jpeg').toBuffer()

	await uploadImageToBucket(imageName, sharpedBuffer, 'image/jpeg', folder)
}
