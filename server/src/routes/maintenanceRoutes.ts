import { Router } from 'express'
import {
    getServiceLogs,
    createServiceLog,
    updateServiceLog,
    deleteServiceLog,
    getVehiclesForForm,
} from '../controllers/maintenance.controller'
import { requireAuth } from '../middleware/authMiddleware'

const router = Router()

router.get('/vehicles', requireAuth, getVehiclesForForm)
router.get('/', requireAuth, getServiceLogs)
router.post('/', requireAuth, createServiceLog)
router.patch('/:id', requireAuth, updateServiceLog)
router.delete('/:id', requireAuth, deleteServiceLog)

export default router
