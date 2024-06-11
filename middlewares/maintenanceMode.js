const maintenanceMode = (req, res, next) => {
	if (process.env.MAINTENANCE_MODE === 'true') {
		return res
			.status(503)
			.json({
				message:
					'The site is currently under maintenance. Please try again later.',
			})
	}
	next()
}

export default maintenanceMode
