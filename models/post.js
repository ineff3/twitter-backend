import { postSchema } from '../schemas/post.js'
import { getSignedImageUrl } from '../shared/s3/s3BucketActions.js'
import mongoose from 'mongoose'

const statics = {}
Object.assign(postSchema.statics, statics)

postSchema.methods.refactorPost = function (userId) {
	return {
		_id: this._id,
		author: this.author,
		text: this.text,
		postImages: this.postImages,
		postImageUrls: this.postImageUrls,
		createdAt: this.createdAt,
		likesCount: this.likesCount,
		isLiked: this.likedBy.indexOf(userId) !== -1,
		isBookmarked: this.bookmarkedBy.indexOf(userId) !== -1,
	}
}
postSchema.virtual('postImageUrls').get(function () {
	if (this.postImages && this.postImages.length > 0) {
		return this.postImages.map((path) => getSignedImageUrl(path))
	}
})
postSchema.virtual('likesCount').get(function () {
	return this.likedBy.length
})

postSchema.set('toJSON', { virtuals: true })
postSchema.set('toObject', { virtuals: true })
export const PostModel = mongoose.model('Post', postSchema)
