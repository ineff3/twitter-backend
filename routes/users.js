import { Router } from 'express'
import UserController from '../controllers/users.js'
import checkAuth from '../middlewares/check-auth.js'

const router = Router()

router.post('/signup', UserController.signup)

router.post('/login', UserController.login)

router.get('/logout', UserController.logout)

router.get('/refresh', UserController.handleRefreshToken)

router.get('/', checkAuth, (req, res, next) => {
	res.status(200).json({ lol: 'kek' })
})

export default router
