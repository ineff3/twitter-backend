import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	dateCreated: { type: String, required: true },
	likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	text: { type: String },
	postImages: [{ type: String }],
})

export default mongoose.model('Post', postSchema)
