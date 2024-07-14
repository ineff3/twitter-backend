import { UserModel } from '../models/user.js'
import { UserService } from '../services/userService.js'
import { NotFoundError } from '../shared/BaseError.js'

const userServiceInstance = new UserService(UserModel, 20)

export const UserController = {
	async signup(req, res, next) {
		const { firstName, secondName, email, password } = req.body
		try {
			const createdUser = await userServiceInstance.createUser({
				firstName,
				secondName,
				email,
				password,
			})
			res.status(201).json(createdUser)
		} catch (err) {
			next(err)
		}
	},
	async login(req, res, next) {
		const { email, password } = req.body
		try {
			const { accessToken, refreshToken } =
				await userServiceInstance.login(email, password)
			res.cookie('jwt', refreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: 'None',
				maxAge: 24 * 60 * 60 * 1000,
			})

			res.json({ accessToken })
		} catch (err) {
			next(err)
		}
	},
	async handleRefreshToken(req, res, next) {
		try {
			const refreshToken = req.cookies.jwt
			const accessToken = await userServiceInstance.handleRefreshToken(
				refreshToken
			)
			res.status(200).json({ accessToken })
		} catch (err) {
			next(err)
		}
	},
	async logout(req, res, next) {
		try {
			const refreshToken = req.cookies.jwt
			await userServiceInstance.logout(refreshToken)

			res.clearCookie('jwt', {
				httpOnly: true,
				sameSite: 'None',
				secure: true,
			})

			res.sendStatus(204)
		} catch (err) {
			next(err)
		}
	},
	async getPreview(req, res, next) {
		try {
			const userPreview = await userServiceInstance.getPreview(req.userId)
			res.status(200).json(userPreview)
		} catch (err) {
			next(err)
		}
	},
	async getUsernames(req, res, next) {
		try {
			const usernames = await userServiceInstance.getUsernames(req.userId)
			res.status(200).json({ usernames })
		} catch (err) {
			next(err)
		}
	},
	async checkUsername(req, res, next) {
		const { username } = req.body
		try {
			const isReserved =
				await userServiceInstance.checkUsernameIsReserved(username)
			res.status(200).json({ isReserved })
		} catch (err) {
			next(err)
		}
	},
	async getUserByName(req, res, next) {
		const { username } = req.params
		try {
			if (!username) {
				throw new NotFoundError('Username')
			}
			const [userData, isCurrentUser] =
				await userServiceInstance.getUserByName(req.userId, username)

			res.status(200).json({
				isCurrentUser,
				userData,
			})
		} catch (err) {
			next(err)
		}
	},
	async updateUser(req, res, next) {
		const { updateType, newValue } = req.body
		try {
			await userServiceInstance.updateUser(
				req.userId,
				updateType,
				newValue,
				req.file
			)
			res.sendStatus(204)
		} catch (err) {
			next(err)
		}
	},
	async editUser(req, res, next) {
		const { userImage, backgroundImage } = req.files
		const { firstName, secondName, bio, location, link } = req.body
		try {
			await userServiceInstance.editAccount(
				req.userId,
				{ firstName, secondName, bio, location, link },
				{ userImage, backgroundImage }
			)
			res.sendStatus(204)
		} catch (err) {
			next(err)
		}
	},
}
