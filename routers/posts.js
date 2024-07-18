import { Router } from 'express'
import { checkAuth } from '../middlewares/checkAuth.js'
import { PostController } from '../controllers/post.js'
import { upload } from '../middlewares/handleImage.js'

const {
	createPost,
	deletePost,
	getPosts,
	getUserPosts,
	likePost,
	bookmarkPost,
} = PostController

const router = Router()
router.use(checkAuth)

router.route('').get(getPosts).post(upload.array('postImages', 4), createPost)

router.delete('/:postId', deletePost)

router.patch('/:postId/like', likePost)
router.patch('/:postId/bookmark', bookmarkPost)

router.get('/:userId', getUserPosts)

export default router
