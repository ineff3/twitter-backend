import { Router } from 'express'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'
import PostController from '../controllers/posts.js'

const router = Router()

router.get('/getPosts', checkAuth, PostController.getAllPosts)

router.get('/getBookmarkedPosts', checkAuth, PostController.getBookmarkedPosts)

router.post(
	'/createPost',
	checkAuth,
	upload('posts').array('postImages', 4),
	PostController.createPost
)

router.post('/likePost', checkAuth, PostController.likePost)

router.post('/bookmarkPost', checkAuth, PostController.bookmarkPost)

export default router
