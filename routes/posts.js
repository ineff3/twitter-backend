import { Router } from 'express'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'
import PostController from '../controllers/posts.js'

const router = Router()

router.post('/like', checkAuth, PostController.likePost)

router.post('/bookmark', checkAuth, PostController.bookmarkPost)

router.get('', checkAuth, PostController.getPosts)

router.post(
	'',
	checkAuth,
	upload('posts').array('postImages', 4),
	PostController.createPost
)

export default router
