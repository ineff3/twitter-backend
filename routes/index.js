import { Router } from 'express'
import usersRouter from './users.js'
import ServerError from '../utils/server-error.js'

const api = Router()
api.use('/users', usersRouter)

//if route wa not found
api.use('/', (req, res, next) => {
	throw new ServerError(404, 'Route not found')
})
export default api
