import UserModel from '../../models/user.js'
import ServerError from '../../utils/server-error.js'
import generateUsernamesArray from '../../utils/generate-usernames.js'
import fs from 'fs-extra'

const UserController = {
	//requires check-auth middleware
	getCurrentUserPreview: async (req, res, next) => {
		try {
			const user = await UserModel.findById(req.userId)
				.select(' _id firstName username userImage')
				.exec()
			if (!user) {
				throw new ServerError(404, 'User not found')
			}
			res.status(200).json(user)
		} catch (err) {
			next(err)
		}
	},

	//requires auth. Based on first name
	getRandomUsernames: async (req, res, next) => {
		try {
			const user = await UserModel.findById(req.userId).exec()
			if (!user) {
				throw new ServerError(404, 'User not found')
			}
			const firstName = user.firstName
			const possibleUsernames = []
			while (possibleUsernames.length < 5) {
				const userNames = generateUsernamesArray(firstName, 5)
				await Promise.all(
					userNames.map(async (userName) => {
						const response = UserModel.findOne({
							username: userName,
						}).exec()
						if (response) {
							possibleUsernames.push(userName)
						}
					})
				)
			}

			res.status(200).json({ usernames: possibleUsernames })
		} catch (err) {
			next(err)
		}
	},

	checkUsernameIsReserved: async (req, res, next) => {
		try {
			const username = req.body.username
			if (!username) throw new ServerError(404, 'Username not provided')
			const user = await UserModel.findOne({ username: username })

			if (!user) {
				res.status(200).json({ isReserved: false })
			} else {
				res.status(200).json({ isReserved: true })
			}
		} catch (err) {
			next(err)
		}
	},

	// 		const username = req.body.username
	// 		if (!username)
	// 			throw new ServerError(404, 'Username is not provided')

	// 		const user = await UserModel.findOneAndUpdate(
	// 			{ _id: req.userId },
	// 			{ $set: { username: username } }
	// 		).exec()
	// 		res.sendStatus(200)
	// 	} catch (err) {
	// 		next(err)
	// 	}
	// },

	// //requires image middleware
	// updateUserImage: async (req, res, next) => {
	// 	try {
	// 		if (!req.file) {
	// 			throw new ServerError(404, 'UserImage is not provided')
	// 		}
	// 		const user = await UserModel.findById(req.userId).exec()
	// 		if (!user) {
	// 			throw new ServerError(404, 'User is not found')
	// 		}
	// 		const oldPhoto = user.userImage
	// 		if (oldPhoto) {
	// 			await fs.remove(oldPhoto)
	// 		}

	// 		user.userImage = req.file.path
	// 		await user.save()

	// 		// const user = await UserModel.findOneAndUpdate(
	// 		// 	{ _id: req.userId },
	// 		// 	{ $set: { userImage: req.file.path } }
	// 		// ).exec()
	// 		res.sendStatus(200)
	// 	} catch (err) {
	// 		next(err)
	// 	}
	// },

	//requires auth
	getUserByName: async (req, res, next) => {
		try {
			const currentAuthorizedUserId = req.userId
			const providedUsername = req.params.username

			if (!providedUsername) {
				throw new ServerError(404, 'Username required')
			}

			const providedUser = await UserModel.findOne({
				username: providedUsername,
			})
				.select(' -refreshToken -__v -password')
				.exec()
			if (!providedUser) {
				throw new ServerError(
					404,
					'User with provided username not found'
				)
			}
			if (currentAuthorizedUserId === String(providedUser._id)) {
				res.status(200).json({
					isCurrentUser: true,
					userData: providedUser,
				})
			} else {
				res.status(200).json({
					isCurrentUser: false,
					userData: providedUser,
				})
			}
		} catch (err) {
			next(err)
		}
	},

	updateUser: async (req, res, next) => {
		const { updateType, newValue } = req.body

		try {
			switch (updateType) {
				case 'username':
					await updateUsername(req.userId, newValue)
					res.sendStatus(200)
					break
				case 'userImage':
					await updateUserImage(req.userId, req.file)
					res.sendStatus(200)
					break
				default:
					throw new ServerError(404, 'Invalid update type')
			}
		} catch (err) {
			next(err)
		}
	},
}

const updateUsername = async (userId, newUsername) => {
	if (!newUsername) throw new ServerError(404, 'Username is not provided')
	await UserModel.findOneAndUpdate(
		{ _id: userId },
		{ $set: { username: newUsername } }
	).exec()
}

const updateUserImage = async (userId, newUserImage) => {
	if (!newUserImage) {
		throw new ServerError(404, 'UserImage is not provided')
	}
	const user = await UserModel.findById(userId).exec()
	if (!user) {
		throw new ServerError(404, 'User is not found')
	}
	const oldPhoto = user.userImage
	if (oldPhoto) {
		await fs.remove(oldPhoto)
	}

	user.userImage = newUserImage.path
	await user.save()
}

export default UserController
