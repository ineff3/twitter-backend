const refactorPost = (post, user) => {
	const postObj = post.toObject()
	return {
		...postObj,
		likedBy: post.likedBy.length,
		isLiked: post.likedBy.indexOf(user._id) != -1,
		isBookmarked: user.bookmarks.indexOf(post._id) != -1,
	}
}

export default refactorPost
