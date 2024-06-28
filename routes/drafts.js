import { Router } from 'express'
import DraftsController from '../controllers/drafts.js'
import upload from '../middlewares/handleImage.js'
import checkAuth from '../middlewares/check-auth.js'

const router = Router()
router.use('/', checkAuth)

router.post(
	'/',
	upload('users').array('postImages', 4),
	DraftsController.createDraft
)

router.get('/', DraftsController.getDrafts)

router.delete('/:draftId', DraftsController.deleteDraft)

export default router
