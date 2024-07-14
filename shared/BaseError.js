export const HttpErrorCodes = {
	BAD_REQUEST: 400,
	NOT_FOUND: 404,
	INTERNAL_SERVER: 500,
	UNAUTHORIZED: 401,
}

export class BaseError extends Error {
	constructor(name, httpCode, description) {
		super(description)
		Object.setPrototypeOf(this, new.target.prototype)

		this.name = name
		this.httpCode = httpCode

		Error.captureStackTrace(this)
	}
}

export class NotFoundError extends BaseError {
	constructor(resource = 'Resource') {
		super(
			'NOT_FOUND_ERROR',
			HttpErrorCodes.NOT_FOUND,
			`${resource} not found`
		)
	}
}

export class ValidationError extends BaseError {
	constructor(field, cause) {
		super(
			'VALIDATION_ERROR',
			HttpErrorCodes.BAD_REQUEST,
			`Validation error for field "${field}": ${cause}`
		)
	}
}

export class UnauthorizedError extends BaseError {
	constructor(cause) {
		'ANUTHORIZED_ERROR',
			HttpErrorCodes.UNAUTHORIZED,
			`Authorization failed: ${cause}`
	}
}
