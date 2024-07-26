import { Router } from 'express'
import { checkAuth } from '../middlewares/checkAuth.js'
import { DraftController } from '../controllers/draft.js'
import { upload } from '../middlewares/handleImage.js'

const { getDrafts, createDraft, deleteMultipleDrafts } = DraftController
const router = Router()
router.use(checkAuth)
router
	.route('/')
	.get(getDrafts)
	.post(upload.array('postImages', 4), createDraft)
	.delete(deleteMultipleDrafts)

export default router
