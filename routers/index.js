import { Router } from 'express'
import usersRouter from './users.js'
import authRouter from './auth.js'
import postsRouter from './posts.js'
import draftsRouter from './drafts.js'
import { NotFoundError } from '../shared/BaseError.js'

const api = Router()
api.use('/users', authRouter, usersRouter)
api.use('/posts', postsRouter)
api.use('/drafts', draftsRouter)

//if route was not found
api.use('/', (req, res, next) => {
	throw new NotFoundError('Route')
})
export default api
