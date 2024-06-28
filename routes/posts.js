import { Router } from 'express'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'
import PostController from '../controllers/posts.js'

const router = Router()
router.use('/', checkAuth)
router.post('/like', PostController.likePost)

router.post('/bookmark', PostController.bookmarkPost)

router.get('', PostController.getPosts)

router.get('/:userId', PostController.getUserPosts)

router.post(
	'',

	upload('posts').array('postImages', 4),
	PostController.createPost
)

router.delete('/:postId', PostController.deletePost)

export default router
