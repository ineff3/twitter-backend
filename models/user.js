import mongoose from 'mongoose'
import { userSchema } from '../schemas/user.js'
import { getSignedImageUrl } from '../shared/s3/s3BucketActions.js'
import {
	BaseError,
	NotFoundError,
	UnauthorizedError,
} from '../shared/BaseError.js'
import bcrypt from 'bcrypt'

const statics = {
	async getUserById(userId) {
		const user = await this.findById(userId)
		if (!user) {
			throw new NotFoundError('User')
		}

		return user
	},
	async createUser(newUser) {
		const userExists = await this.findOne({ email: newUser.email })
		if (userExists) {
			throw new BaseError(
				'CONFLICT_ERROR',
				409,
				'User with such email already exists'
			)
		}
		const user = await this.create(newUser)
		return user.toObject()
	},
	async findByEmailAndValidatePassword(email, password) {
		const user = await this.findOne({ email })
		if (!user) {
			throw new NotFoundError('User')
		}
		const match = await bcrypt.compare(password, user.password)
		if (!match) {
			throw new UnauthorizedError('wrong creadentials')
		}
		return user
	},
	async findByRefreshToken() {
		const user = await this.findOne({ refreshToken })
		if (!user) {
			throw new NotFoundError('User')
		}
		return user
	},
	async saveRefreshToken(userId, refreshToken) {
		const user = await this.getUserById(userId)
		user.refreshToken = refreshToken
		await user.save()
	},
	async logoutUserByToken(refreshToken) {
		const user = this.findByRefreshToken(refreshToken)
		user.refreshToken = ''
		await user.save()
	},
}

const methods = {
	appendDraftUrls() {
		return {
			...this.toObject(),
			drafts: this.drafts.map((draft) => ({
				...draft.toObject(),
				draftImageUrls: draft.postImages.map((imagePath) =>
					getSignedImageUrl(imagePath)
				),
			})),
		}
	},
}

Object.assign(userSchema.statics, statics)
Object.assign(userSchema.methods, methods)

userSchema.virtual('userImageUrl').get(function () {
	if (this.userImage) {
		return getSignedImageUrl(this.userImage)
	}
})
userSchema.virtual('backgroundImageUrl').get(function () {
	if (this.backgroundImage) {
		return getSignedImageUrl(this.backgroundImage)
	}
})

userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

export const UserModel = mongoose.model('User', userSchema)
