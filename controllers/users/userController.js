import UserModel from '../../models/user.js'
import ServerError from '../../utils/serverError.js'
import generateUsernamesArray from '../../utils/generateUsernames.js'
import fs from 'fs-extra'
import sharp from 'sharp'
import {
	deleteImageFromBucket,
	uploadImageToBucket,
} from '../../utils/s3BucketUtils.js'
import invalidateCloudFrontCache from '../../utils/cloudFrontActions.js'

const UserController = {
	//requires check-auth middleware
	getCurrentUserPreview: async (req, res, next) => {
		try {
			let user = await UserModel.findById(req.userId)
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
					break
				case 'userImage':
					await updateUserImage(req.userId, req.file)
					break
				default:
					throw new ServerError(404, 'Invalid update type')
			}
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},

	editAccount: async (req, res, next) => {
		const { userImage, backgroundImage } = req.files
		const { firstName, secondName, bio, location, link } = req.body

		const user = await UserModel.findById(req.userId).exec()

		if (firstName !== undefined) user.firstName = firstName
		if (secondName !== undefined) user.secondName = secondName
		if (bio !== undefined) user.bio = bio
		if (location !== undefined) user.location = location
		if (link !== undefined) user.link = link

		console.log(userImage)

		if (userImage?.length > 0) {
			const oldUserImage = user.userImage
			if (oldUserImage) {
				await fs.remove(oldUserImage)
			}
			user.userImage = userImage[0].path
		}
		if (backgroundImage?.length > 0) {
			const oldBackgroundImage = user.backgroundImage
			if (oldBackgroundImage) {
				await fs.remove(oldBackgroundImage)
			}
			user.backgroundImage = backgroundImage[0].path
		}

		await user.save()
		res.sendStatus(200)
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
	const resizedImageBuffer = await sharp(newUserImage.buffer)
		.resize(200)
		.toFormat('jpeg')
		.jpeg({ quality: 80 })
		.toBuffer()
	const newImageName = new Date().toISOString() + newUserImage.originalname
	//Saving the new user image to s3 bucket
	await uploadImageToBucket(newImageName, resizedImageBuffer, 'image/jpeg')

	// Handling existing image (if it was)
	const oldImage = user.userImage
	if (oldImage) {
		await deleteImageFromBucket(oldImage)
		await invalidateCloudFrontCache(oldImage)
	}
	user.userImage = newImageName
	await user.save()
}

export default UserController
