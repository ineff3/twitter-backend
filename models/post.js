import mongoose from 'mongoose'
import { getSignedImageUrl } from '../utils/s3BucketUtils.js'

const postSchema = new mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		text: { type: String },
		postImages: [{ type: String }],
	},
	{ timestamps: true }
)

postSchema.virtual('postImageUrls').get(function () {
	if (this.postImages && this.postImages.length > 0) {
		return this.postImages.map((path) => getSignedImageUrl(path))
	}
})
postSchema.methods.refactorPost = function (user) {
	const postObj = this.toObject()
	return {
		...postObj,
		likedBy: this.likedBy.length,
		isLiked: this.likedBy.indexOf(user._id) !== -1,
		isBookmarked: user.bookmarks.indexOf(this._id) !== -1,
	}
}

postSchema.set('toJSON', { virtuals: true })
postSchema.set('toObject', { virtuals: true })
export default mongoose.model('Post', postSchema)
