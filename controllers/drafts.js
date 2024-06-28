import mongoose from 'mongoose'
import UserModel from '../models/user.js'
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
			const newDrafts = user.drafts.filter(
				(draft) => draft._id.toString() !== draftId
			)
			user.drafts = newDrafts
			await user.save()
			res.sendStatus(200)
		} catch (err) {
			next(err)
		}
	},
}

export default DraftsController
