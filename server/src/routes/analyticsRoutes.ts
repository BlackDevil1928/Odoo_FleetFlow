import { Router } from 'express'
import { getAnalytics } from '../controllers/analytics.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()
router.get('/', requireAuth, getAnalytics)

export default router
