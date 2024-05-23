import { Router } from 'express'
import {
	UserController,
	UserAuthController,
} from '../controllers/users/index.js'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'

const router = Router()

router.post('/signup', UserAuthController.signup)

router.post('/login', UserAuthController.login)

router.get('/logout', UserAuthController.logout)

router.get('/refresh', UserAuthController.handleRefreshToken)

router.get(
	'/currentUserPreview',
	checkAuth,
	UserController.getCurrentUserPreview
)

router.get('/usernames', checkAuth, UserController.getRandomUsernames)

router.post(
	'/checkUsernameIsReserved',
	checkAuth,
	UserController.checkUsernameIsReserved
)

router.patch(
	'/',
	checkAuth,
	upload('users').single('userImage'),
	UserController.updateUser
)

router.get('/:username', checkAuth, UserController.getUserByName)

export default router
