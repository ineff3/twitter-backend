import mongoose from 'mongoose'
import UserModel from '../models/user.js'
import ServerError from '../utils/server-error.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import generateUsernamesArray from '../utils/generate-usernames.js'
import fs from 'fs-extra'

const UserController = {
	signup: (req, res, next) => {
		const { firstName, secondName, email, password } = req.body
		UserModel.findOne({ email: email })
			.exec()
			.then((user) => {
				if (user) {
					throw new ServerError(
						409,
						'Auth failed: User with such email already exists'
					)
				} else {
					bcrypt.hash(password, 10, (err, hash) => {
						if (err) {
							next(err)
						} else {
							const userName = generateUsernamesArray(
								firstName,
								1
							)
							UserModel.create({
								_id: new mongoose.Types.ObjectId(),
								firstName: firstName,
								secondName: secondName,
								email: email,
								password: hash,
								username: userName[0],
							})
								.then((result) => {
									console.log(result)
									res.status(201).json(result)
								})
								.catch((err) => next(err))
						}
					})
				}
			})
			.catch((err) => next(err))
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

	//requires check-auth middleware
	getUserByAccessToken: async (req, res, next) => {
		try {
			const user = await UserModel.findById(req.userId)
				.select(' -refreshToken -__v')
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

	updateUsername: async (req, res, next) => {
		try {
			const username = req.body.username
			if (!username)
				throw new ServerError(404, 'Username is not provided')

			const user = await UserModel.findOneAndUpdate(
				{ _id: req.userId },
				{ $set: { username: username } }
			).exec()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},

	//requires image middleware
	updateUserImage: async (req, res, next) => {
		try {
			console.log(req.file)
			if (!req.file) {
				throw new ServerError(404, 'UserImage is not provided')
			}
			const user = await UserModel.findById(req.userId).exec()
			if (!user) {
				throw new ServerError(404, 'User is not found')
			}
			const oldPhoto = user.userImage
			if (oldPhoto) {
				await fs.remove(oldPhoto)
			}

			user.userImage = req.file.path
			await user.save()

			// const user = await UserModel.findOneAndUpdate(
			// 	{ _id: req.userId },
			// 	{ $set: { userImage: req.file.path } }
			// ).exec()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
}

export default UserController
