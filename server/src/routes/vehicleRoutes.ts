import { Router } from 'express'
import {
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
} from '../controllers/vehicle.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/', requireAuth, getVehicles)
router.post('/', requireAuth, createVehicle)
router.patch('/:id', requireAuth, updateVehicle)
router.delete('/:id', requireAuth, deleteVehicle)

export default router
