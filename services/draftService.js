import mongoose from 'mongoose'
import { uploadFilesArray } from '../shared/s3Uploads/uploadMultiple.js'
import { ValidationError } from '../shared/BaseError.js'

export class DraftService {
	#S3_UPLOAD_PATH
	constructor(UserModel) {
		this.UserModel = UserModel
	}

	async getDrafts(userId) {
		const user = await this.UserModel.getUserById(userId)
		const userWithDraftUrls = user.appendDraftUrls()
		return userWithDraftUrls.drafts
	}
	async createDraft(userId, text, files) {
		const user = await this.UserModel.getUserById(userId)
		const postFiles = await uploadFilesArray(files, this.#S3_UPLOAD_PATH)
		const draft = {
			_id: new mongoose.Types.ObjectId(),
			text: text ?? '',
			postImages: postFiles.map(
				(file) => `${S3_UPLOAD_PATH}/${file.newName}`
			),
		}
		user.drafts.push(draft)
		await user.save()
		return draft
	}
	async deleteMultiple(draftIds, userId) {
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
			throw new ValidationError('Draft id', 'Invalid draft id')
		}
		const user = await this.UserModel.getUserById(userId)
		user.drafts = user.drafts.filter(
			(draft) => !draftIdsArr.includes(draft._id.toString())
		)
		await user.save()
	}
}
