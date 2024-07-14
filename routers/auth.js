import { Router } from 'express'
import { UserController } from '../controllers/user.js'

const router = Router()
const { signup, login, handleRefreshToken, logout } = UserController

router.post('/signup', signup)
router.post('/login', login)
router.get('/logout', logout)
router.get('/refresh', handleRefreshToken)

export default router
