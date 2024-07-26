import { DraftService } from '../services/draftService.js'
import { UserModel } from '../models/user.js'
import { NotFoundError } from '../shared/BaseError.js'

const draftServiceInstance = new DraftService(UserModel)
export const DraftController = {
	async getDrafts(req, res, next) {
		try {
			const drafts = await draftServiceInstance.getDrafts(req.userId)
			res.status(200).send(drafts)
		} catch (err) {
			next(err)
		}
	},
	async createDraft(req, res, next) {
		const { text } = req.body
		try {
			const newDraft = await draftServiceInstance.createDraft(
				req.userId,
				text,
				req.files
			)
			res.status(201).send(newDraft)
		} catch (err) {
			next(err)
		}
	},
	async deleteMultipleDrafts(req, res, next) {
		const { draftIds } = req.query
		try {
			if (!draftIds) {
				throw new NotFoundError('Draft ids')
			}
			await draftServiceInstance.deleteMultiple(draftIds, req.userId)
			res.sendStatus(204)
		} catch (err) {
			next(err)
		}
	},
}
