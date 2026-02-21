import { Router } from 'express'
import {
    getDriverPerformance,
    getAllDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
} from '../controllers/driver.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()
router.get('/performance', requireAuth, getDriverPerformance)
router.get('/', requireAuth, getAllDrivers)
router.post('/', requireAuth, createDriver)
router.patch('/:id', requireAuth, updateDriver)
router.delete('/:id', requireAuth, deleteDriver)

export default router
