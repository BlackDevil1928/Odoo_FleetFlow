import { Router } from 'express'
import {
    getTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    getAvailableResources,
} from '../controllers/trip.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/available-resources', requireAuth, getAvailableResources)
router.get('/', requireAuth, getTrips)
router.post('/', requireAuth, createTrip)
router.patch('/:id', requireAuth, updateTrip)
router.delete('/:id', requireAuth, deleteTrip)

export default router
