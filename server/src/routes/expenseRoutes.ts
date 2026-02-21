import { Router } from 'express'
import {
    getExpenses,
    getCompletedTrips,
    createExpense,
    deleteExpense,
} from '../controllers/expense.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()
router.get('/completed-trips', requireAuth, getCompletedTrips)
router.get('/', requireAuth, getExpenses)
router.post('/', requireAuth, createExpense)
router.delete('/:id', requireAuth, deleteExpense)

export default router
