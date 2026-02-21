import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard.controller'
import { getAiInsights } from '../controllers/aiInsights.controller'
import { requireAuth, requireRole } from '../middleware/authMiddleware'

const router = Router()

// GET /api/dashboard — manager only
router.get('/', requireAuth, requireRole('manager'), getDashboard)

export default router
