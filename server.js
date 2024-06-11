import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import routes from './routes/index.js'
import maintenanceMode from './middlewares/maintenanceMode.js'

const app = express()
mongoose.connect(process.env.DB_CONNECTION_STRING)
/**
 * App Configuration
 */

app.use(
	cors({
		credentials: true,
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	})
)
app.use('/uploads', express.static('uploads'))
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser())
app.use(maintenanceMode)
app.use(routes)

/**
 * Error handler
 */
app.use((err, req, res, next) => {
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
