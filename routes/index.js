import { Router } from 'express'
import usersRouter from './users.js'
import postsRouter from './posts.js'
import draftsRouter from './drafts.js'
import ServerError from '../utils/serverError.js'

const api = Router()
api.use('/users', usersRouter)
api.use('/posts', postsRouter)
api.use('/drafts', draftsRouter)

//if route was not found
api.use('/', (req, res, next) => {
	throw new ServerError(404, 'Route not found')
})
export default api
