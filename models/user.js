import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	firstName: { type: String, required: true },
	secondName: { type: String, required: true },
	email: {
		type: String,
		required: true,
		unique: true,
		match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
	},
	password: { type: String, required: true },
})

export default mongoose.model('User', userSchema)
