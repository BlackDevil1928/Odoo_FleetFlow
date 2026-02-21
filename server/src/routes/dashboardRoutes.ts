import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard.controller'
import { getAiInsights } from '../controllers/aiInsights.controller'
import { requireAuth, requireRole } from '../middleware/authMiddleware'

const router = Router()

// GET /api/dashboard — all authenticated roles
router.get('/', requireAuth, getDashboard)

export default router
