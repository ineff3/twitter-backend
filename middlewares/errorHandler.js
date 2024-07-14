import { BaseError } from '../shared/BaseError.js'

export const errorHandler = (err, req, res, next) => {
	if (err instanceof BaseError) {
		console.log('Operational error from errorHandler', err)
		res.status(err.httpCode).json({
			name: err.name,
			message: err.message,
		})
	} else {
		console.error(err)
		res.status(500).json({
			name: 'INTERNAL_SERVER_ERROR',
			message: err.message,
		})
	}
}
