import mongoose from 'mongoose'
import UserModel from '../models/user.js'
import ServerError from '../utils/server-error.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const UserController = {
	signup: (req, res, next) => {
		const { firstName, secondName, email, password } = req.body
		UserModel.findOne({ email: email })
			.exec()
			.then((user) => {
				if (user) {
					throw new ServerError(
						409,
						'User with such email alrealy exists'
					)
				} else {
					bcrypt.hash(password, 10, (err, hash) => {
						if (err) {
							next(err)
						} else {
							UserModel.create({
								_id: new mongoose.Types.ObjectId(),
								firstName: firstName,
								secondName: secondName,
								email: email,
								password: hash,
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
					'Authorization failed: passwords do not match'
				)
			}

			const token = jwt.sign(
				{ email: user.email, _id: user._id },
				process.env.JWT_KEY,
				{
					expiresIn: '1h',
				}
			)
			res.status(200).json({
				message: 'Successfully authorized',
				token: token,
				user: user,
			})
		} catch (err) {
			next(err)
		}
	},
}

export default UserController
