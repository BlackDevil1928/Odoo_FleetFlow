import { Router } from 'express'
import { getAiInsights } from '../controllers/aiInsights.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

// GET /api/ai-insights — any authenticated user
router.get('/', requireAuth, getAiInsights)

export default router
