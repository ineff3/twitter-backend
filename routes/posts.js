import { Router } from 'express'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'
import PostController from '../controllers/posts.js'

const router = Router()

router.get('/getPosts', checkAuth, PostController.getAllPosts)

router.post(
	'/createPost',
	checkAuth,
	upload('posts').array('postImages', 4),
	PostController.createPost
)

export default router
