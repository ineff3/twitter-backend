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

router.get('/getAuthorizedUser', checkAuth, UserController.getUserByAccessToken)

router.get(
	'/getPossibleUsernames',
	checkAuth,
	UserController.getRandomUsernames
)
router.post(
	'/checkUsernameIsReserved',
	checkAuth,
	UserController.checkUsernameIsReserved
)

router.patch('/updateUsername', checkAuth, UserController.updateUsername)

router.get('/', checkAuth, (req, res, next) => {
	res.status(200).json({ lol: 'kek' })
})

router.patch(
	'/updateUserImage',
	checkAuth,
	upload('users').single('userImage'),
	UserController.updateUserImage
)

router.get('/:username', checkAuth, UserController.fetchUserProfile)

export default router
