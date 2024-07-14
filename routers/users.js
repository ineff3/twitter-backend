import { Router } from 'express'
import { UserController } from '../controllers/user.js'
import { checkAuth } from '../middlewares/checkAuth.js'
import { upload } from '../middlewares/handleImage.js'

const router = Router()
const {
	getPreview,
	getUsernames,
	checkUsername,
	getUserByName,
	updateUser,
	editUser,
} = UserController

router.use(checkAuth)
router.get('/preview', getPreview)
router.get('/usernames', getUsernames)
router.post('/check-username', checkUsername)

router.get('/:username', getUserByName)

router
	.route('/')
	.patch(upload.single('userImage'), updateUser)
	.put(
		upload.fields([
			{ name: 'userImage', maxCount: 1 },
			{ name: 'backgroundImage', maxCount: 1 },
		]),
		editUser
	)

export default router
