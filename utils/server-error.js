class ServerError extends Error {
	constructor(errorCode, message) {
		super(message)
		this.errorCode = errorCode
	}
}

export default ServerError
