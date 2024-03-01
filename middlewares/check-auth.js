import jwt from 'jsonwebtoken'

//middleware fails if there is no token passed through the body
const checkAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization
		if (!authHeader?.startsWith('Bearer '))
			return res.status(401).json({ message: 'Auth failed' })
		const token = authHeader.split(' ')[1]
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (err) {
		console.log(err)
		return res.status(403).json({
			message: 'Invalid token',
		})
	}
	next()
}

export default checkAuth
