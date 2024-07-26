import mongoose from 'mongoose'

export const userSchema = new mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		firstName: { type: String, required: true },
		secondName: { type: String, required: true },
		email: {
			type: String,
			required: true,
			unique: true,
			match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
		},
		bio: { type: String },
		location: { type: String },
		link: { type: String },
		username: {
			type: String,
			unique: true,
		},
		userImage: {
			type: String,
		},
		backgroundImage: {
			type: String,
		},
		bornDate: {
			type: String,
		},
		password: { type: String, required: true },
		refreshToken: String,
		drafts: [
			{
				_id: mongoose.Schema.Types.ObjectId,
				text: { type: String },
				postImages: [{ type: String }],
			},
		],
	},
	{ timestamps: true }
)
