import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { AuthenticatedRequest } from '../middleware/authMiddleware'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────
// GET /api/dashboard
// Returns KPI metrics + recent trips for the main dashboard
// ─────────────────────────────────────────────────────────
export const getDashboard = async (
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const [
            totalVehicles,
            activeFleet,
            maintenanceAlerts,
            pendingCargo,
            recentTrips,
        ] = await Promise.all([
            prisma.vehicle.count(),
            prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
            prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
            prisma.trip.count({ where: { status: 'DRAFT' } }),
            prisma.trip.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    vehicle: {
                        select: { plateNumber: true, make: true, model: true },
                    },
                    driver: {
                        select: { fullName: true },
                    },
                },
            }),
        ])

        const utilizationRate =
            totalVehicles > 0
                ? Math.round((activeFleet / totalVehicles) * 100)
                : 0

        res.json({
            activeFleet,
            maintenanceAlerts,
            pendingCargo,
            utilizationRate,
            totalVehicles,
            recentTrips,
        })
    } catch (err) {
        console.error('[Dashboard] Error:', err)
        res.status(500).json({ error: 'Failed to fetch dashboard data.' })
    }
}
