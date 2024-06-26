import mongoose from 'mongoose'
import UserModel from '../../models/user.js'
import ServerError from '../../utils/serverError.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import generateUsernamesArray from '../../utils/generateUsernames.js'
import { getUserCount } from '../../services/userService.js'

const MAX_USERS = 20

const UserAuthController = {
	signup: async (req, res, next) => {
		try {
			const userCount = await getUserCount()
			if (userCount >= MAX_USERS) {
				throw new ServerError(400, 'User registration limit reached')
			}

			const { firstName, secondName, email, password } = req.body

			const existingUser = await UserModel.findOne({ email }).exec()
			if (existingUser) {
				throw new ServerError(
					409,
					'Auth failed: User with such email already exists'
				)
			}

			const hash = await bcrypt.hash(password, 10)
			const userName = generateUsernamesArray(firstName, 1)
			const newUser = new UserModel({
				_id: new mongoose.Types.ObjectId(),
				firstName,
				secondName,
				email,
				password: hash,
				username: userName[0],
			})

			const result = await newUser.save()
			res.status(201).json(result)
		} catch (error) {
			next(error)
		}
	},

	login: async (req, res, next) => {
		const { email, password } = req.body

		try {
			const user = await UserModel.findOne({ email: email }).exec()
			if (!user) {
				throw new ServerError(
					401,
					'Authorization failed: user not found'
				)
			}

			const match = await bcrypt.compare(password, user.password)

			if (!match) {
				throw new ServerError(
					401,
					'Authorization failed: wrong credentials'
				)
			}

			const accessToken = jwt.sign(
				{ email: user.email, _id: user._id },
				process.env.ACCESS_TOKEN_SECRET,
				{
					expiresIn: '1h',
				}
			)
			const refreshToken = jwt.sign(
				{ email: user.email, _id: user._id },
				process.env.REFRESH_TOKEN_SECRET,
				{
					expiresIn: '1d',
				}
			)
			// saving refresh token into db
			user.refreshToken = refreshToken
			const result = await user.save()

			// Creates Secure Cookie with refresh token
			res.cookie('jwt', refreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: 'None',
				// maxAge: 15 * 1000,
				maxAge: 24 * 60 * 60 * 1000,
			})

			// Send authorization access token to user
			res.json({ accessToken })
		} catch (err) {
			next(err)
		}
	},

	handleRefreshToken: async (req, res, next) => {
		try {
			const refreshToken = req.cookies.jwt
			if (!refreshToken) {
				throw new ServerError(401, 'Refresh token cookie not found')
			}

			const user = await UserModel.findOne({ refreshToken }).exec()
			if (!user) {
				throw new ServerError(
					401,
					'Authorization failed: user not found'
				)
			}

			// throws error if token is not veryfied properly
			const decoded = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET
			)

			const accessToken = jwt.sign(
				{ email: user.email, _id: user._id },
				process.env.ACCESS_TOKEN_SECRET,
				{
					expiresIn: '1h',
				}
			)
			res.status(200).json({
				accessToken,
			})
		} catch (err) {
			next(err)
		}
	},

	logout: async (req, res, next) => {
		try {
			const refreshToken = req.cookies.jwt
			if (!refreshToken) {
				throw new ServerError(401, 'Refresh token cookie not found')
			}

			// Is refreshToken in db?
			const user = await UserModel.findOne({ refreshToken }).exec()
			if (!user) {
				res.clearCookie('jwt', {
					httpOnly: true,
					sameSite: 'None',
					secure: true,
				})
				return res.sendStatus(204)
			}

			user.refreshToken = ''
			await user.save()

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
}

export default UserAuthController
