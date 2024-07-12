import mongoose from 'mongoose'
import ServerError from '../utils/serverError.js'
import { getUserById } from '../services/userService.js'
import uploadFilesArray from '../utils/files/uploadFilesArray.js'

const S3_UPLOAD_PATH = 'drafts'

const DraftsController = {
	createDraft: async (req, res, next) => {
		try {
			const { text } = req.body
			const user = await getUserById(req.userId)
			const postFiles = await uploadFilesArray(req.files, S3_UPLOAD_PATH)

			const draft = {
				_id: new mongoose.Types.ObjectId(),
				text: text ?? '',
				postImages: postFiles.map(
					(file) => `${S3_UPLOAD_PATH}/${file.newName}`
				),
			}
			user.drafts.push(draft)
			await user.save()
			res.status(201).send(draft)
		} catch (err) {
			next(err)
		}
	},
	getDrafts: async (req, res, next) => {
		try {
			const user = await getUserById(req.userId)
			const userWithDraftUrls = user.appendDraftUrls()
			res.status(200).send(userWithDraftUrls.drafts)
		} catch (err) {
			next(err)
		}
	},
	deleteDraft: async (req, res, next) => {
		try {
			const user = await getUserById(req.userId)
			const { draftId } = req.params
			const draftExists = user.drafts.some(
				(draft) => draft._id.toString() === draftId
			)

			if (!draftExists) {
				return res.status(404).json({ message: 'Draft not found' })
			}

			// Filter out the draft with the given ID
			user.drafts = user.drafts.filter(
				(draft) => draft._id.toString() !== draftId
			)
			await user.save()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
	deleteMultipleDrafts: async (req, res, next) => {
		const { draftIds } = req.query
		try {
			if (!draftIds) {
				throw new ServerError('404', 'Id is not provided')
			}
			let draftIdsArr = []
			if (!Array.isArray(draftIds)) {
				draftIdsArr = [draftIds]
			} else {
				draftIdsArr = [...draftIds]
			}

			if (
				draftIdsArr.some(
					(draftId) => !mongoose.Types.ObjectId.isValid(draftId)
				)
			) {
				throw new ServerError(400, 'Invalid draft Ids')
			}
			const user = await getUserById(req.userId)
			user.drafts = user.drafts.filter(
				(draft) => !draftIdsArr.includes(draft._id.toString())
			)
			await user.save()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
}

export default DraftsController
