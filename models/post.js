import { postSchema } from '../schemas/post.js'
import { getSignedImageUrl } from '../shared/s3/s3BucketActions.js'
import mongoose from 'mongoose'

const statics = {}
Object.assign(postSchema.statics, statics)

postSchema.methods.refactorPost = function (user) {
	const postObj = this.toObject()
	return {
		...postObj,
		likedBy: this.likedBy.length,
		isLiked: this.likedBy.indexOf(user._id) !== -1,
		isBookmarked: user.bookmarks.indexOf(this._id) !== -1,
	}
}
postSchema.virtual('postImageUrls').get(function () {
	if (this.postImages && this.postImages.length > 0) {
		return this.postImages.map((path) => getSignedImageUrl(path))
	}
})

postSchema.set('toJSON', { virtuals: true })
postSchema.set('toObject', { virtuals: true })
export const PostModel = mongoose.model('Post', postSchema)
