import refactorPost from '../utils/refactorPost.js'
import UserModel from '../models/user.js'
import PostModel from '../models/post.js'

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
	const updatedPosts = posts.map((post) => refactorPost(post, user))

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
		refactorPost(post, userInitial)
	)
	const totalCount = userInitial.bookmarks.length

	return { posts: refactoredBookmarks, totalCount }
}
