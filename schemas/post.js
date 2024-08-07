import mongoose from 'mongoose'

export const postSchema = new mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		text: { type: String },
		postImages: [{ type: String }],
	},
	{ timestamps: true }
)
