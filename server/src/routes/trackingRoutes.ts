import { Router } from 'express'
import { getFleetSnapshot } from '../controllers/tracking.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()
router.get('/', requireAuth, getFleetSnapshot)

export default router
