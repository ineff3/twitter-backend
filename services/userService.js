import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { generateUsernames } from '../shared/generateUsernames.js'
import { BaseError, NotFoundError } from '../shared/BaseError.js'
import {
	uploadImageToBucket,
	deleteImageFromBucket,
} from '../shared/s3/s3BucketActions.js'
import { invalidateCloudFrontCache } from '../shared/cloudFront/cloudFrontActions.js'
import sharp from 'sharp'

export class UserService {
	constructor(UserModel, maxUsers = 20) {
		this.UserModel = UserModel
		this.maxUsers = maxUsers
	}

	async createUser(userData) {
		const userAmount = await this.UserModel.countDocuments()
		if (userAmount >= this.maxUsers) {
			throw new BaseError(
				'BAD_REQUEST_ERROR',
				400,
				'User registration limit reached'
			)
		}

		const hashedPassword = await bcrypt.hash(userData.password, 10)
		const generatedUsername = generateUsernames(userData.firstName, 1)

		const createdUser = await this.UserModel.createUser({
			...userData,
			_id: new mongoose.Types.ObjectId(),
			password: hashedPassword,
			username: generatedUsername[0],
		})
		return createdUser
	}
	async login(email, password) {
		const user = await this.UserModel.findByEmailAndValidatePassword(
			email,
			password
		)

		const accessToken = jwt.sign(
			{ email: user.email, _id: user._id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		)

		const refreshToken = jwt.sign(
			{ email: user.email, _id: user._id },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '1d' }
		)

		await this.UserModel.saveRefreshToken(user._id, refreshToken)

		return { accessToken, refreshToken }
	}
	async handleRefreshToken(refreshToken) {
		const user = await this.UserModel.findByRefreshToken(refreshToken)

		jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

		const accessToken = jwt.sign(
			{ email: user.email, _id: user._id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		)

		return accessToken
	}
	async logout(refreshToken) {
		await this.UserModel.logoutUserByToken(refreshToken)
	}
	async getPreview(userId) {
		const user = await this.UserModel.findById(userId).select(
			' _id firstName username userImage'
		)
		if (!user) {
			throw new NotFoundError('User')
		}
		return user
	}
	async getUsernames(userId) {
		const user = await this.UserModel.getUserById(userId)
		return generateUsernames(user.firstName, 5)
	}
	async checkUsernameIsReserved(username) {
		const user = await this.UserModel.findOne({ username })
		const isReserved = user ? true : false
		return isReserved
	}
	async getUserByName(userId, username) {
		const user = await this.UserModel.findOne({ username }).select(
			' -refreshToken -__v -password -drafts'
		)
		if (!user) {
			throw new NotFoundError('User')
		}

		const isCurrentUser = userId === String(user._id)
		return [user, isCurrentUser]
	}
	async updateUser(userId, updateType, newValue, userImage) {
		switch (updateType) {
			case 'username':
				await this.updateUsername(userId, newValue)
				break
			case 'userImage':
				await this.updateUserImage(userId, userImage)
				break
			default:
				throw new ServerError(404, 'Invalid update type')
		}
	}
	async updateUsername(userId, newUsername) {
		if (!newUsername) throw new NotFoundError('username')
		await this.UserModel.findOneAndUpdate(
			{ _id: userId },
			{ $set: { username: newUsername } }
		)
	}
	async updateUserImage(userId, newUserImage) {
		if (!newUserImage) {
			throw new NotFoundError('UserImage')
		}
		const user = await this.UserModel.getUserById(userId)
		const resizedImageBuffer = await sharp(newUserImage.buffer)
			.resize(200)
			.toFormat('jpeg')
			.jpeg({ quality: 80 })
			.toBuffer()
		const newImageName =
			new Date().toISOString() + newUserImage.originalname

		// Saving the new user image to s3 bucket
		await uploadImageToBucket(
			newImageName,
			resizedImageBuffer,
			'image/jpeg'
		)

		// Handling existing image (if it was)
		const oldImage = user.userImage
		if (oldImage) {
			await deleteImageFromBucket(oldImage)
			await invalidateCloudFrontCache(oldImage)
		}

		user.userImage = newImageName
		await user.save()
	}
	async editAccount(userId, updateData, files) {
		const user = await this.UserModel.getUserById(userId)

		const { firstName, secondName, bio, location, link } = updateData
		if (firstName !== undefined) user.firstName = firstName
		if (secondName !== undefined) user.secondName = secondName
		if (bio !== undefined) user.bio = bio
		if (location !== undefined) user.location = location
		if (link !== undefined) user.link = link

		await user.save()

		const { userImage, backgroundImage } = files
		if (userImage?.length > 0) {
			await this.updateUserImage(userId, userImage[0])
		}
		if (backgroundImage?.length > 0) {
			await this.updateBackgroundImage(userId, backgroundImage[0])
		}

		return user
	}
	async updateBackgroundImage(userId, newBackgroundImage) {
		if (!newBackgroundImage) {
			throw new NotFoundError('BackgroundImage')
		}
		const user = await this.UserModel.getUserById(userId)
		const buffer = await sharp(newBackgroundImage.buffer)
			.toFormat('jpeg')
			.toBuffer()
		const newBackgroundImgName =
			new Date().toISOString() + newBackgroundImage.originalname
		//Saving the new user image to s3 bucket
		await uploadImageToBucket(newBackgroundImgName, buffer, 'image/jpeg')

		// Handling existing image (if it was)
		const oldImage = user.backgroundImage
		if (oldImage) {
			await deleteImageFromBucket(oldImage)
			await invalidateCloudFrontCache(oldImage)
		}
		user.backgroundImage = newBackgroundImgName
		await user.save()
	}
}
