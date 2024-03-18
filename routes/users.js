import { Router } from 'express'
import UserController from '../controllers/users.js'
import checkAuth from '../middlewares/check-auth.js'
import upload from '../middlewares/handleImage.js'

const router = Router()

router.post('/signup', UserController.signup)

router.post('/login', UserController.login)

router.get('/logout', UserController.logout)

router.get('/refresh', UserController.handleRefreshToken)

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
	upload.single('userImage'),
	UserController.updateUserImage
)

export default router
