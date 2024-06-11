import UserModel from '../models/user.js'
import PostModel from '../models/post.js'

export const getUserCount = async () => {
	try {
		return await UserModel.countDocuments().exec()
	} catch (err) {
		throw new ServerError(500, 'Error in fetching user count')
	}
}

export const getUserPostsCount = async (userId) => {
	try {
		return await PostModel.countDocuments({ author: userId }).exec()
	} catch (err) {
		throw new ServerError(500, 'Error in fetching user posts count')
	}
}
