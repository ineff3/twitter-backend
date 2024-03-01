import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import routes from './routes/index.js'

const app = express()
mongoose.connect(
	`mongodb+srv://maksym:${process.env.MONGO_ATLAS_PW}@node-backend.qnafux1.mongodb.net/twitter_clone?retryWrites=true&w=majority`
)
/**
 * App Configuration
 */
app.use(cors({ credentials: true, origin: 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(routes)

/**
 * Error handler
 */
app.use((err, req, res, next) => {
	// console.log(err)
	if (err && err.errorCode) {
		res.status(err.errorCode).json({
			message: err.message,
		})
	} else if (err) {
		res.status(500).json({
			errorMessage: err.message,
		})
	}
})

/**
 * Server activation
 */
const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`Server is running on port ${port}...`)
})
