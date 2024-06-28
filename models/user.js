import mongoose from 'mongoose'
import { getSignedImageUrl } from '../utils/s3BucketUtils.js'

const userSchema = new mongoose.Schema(
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
		bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
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
userSchema.methods.appendDraftUrls = function () {
	return {
		...this.toObject(),
		drafts: this.drafts.map((draft) => ({
			...draft.toObject(),
			draftImageUrls: draft.postImages.map((imagePath) =>
				getSignedImageUrl(imagePath)
			),
		})),
	}
}
userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

export default mongoose.model('User', userSchema)
