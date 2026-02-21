import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { AuthenticatedRequest } from '../middleware/authMiddleware'

const prisma = new PrismaClient()

interface Insight {
    type: 'warning' | 'info' | 'danger'
    message: string
}

// ─────────────────────────────────────────────────────────
// GET /api/ai-insights
// Rule-based fleet intelligence insights
// ─────────────────────────────────────────────────────────
export const getAiInsights = async (
    _req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        const [
            totalVehicles,
            activeFleet,
            maintenanceCount,
            pendingTrips,
            recentTrips,
        ] = await Promise.all([
            prisma.vehicle.count(),
            prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
            prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
            prisma.trip.count({ where: { status: 'DRAFT' } }),
            prisma.trip.count({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ])

        const utilizationRate =
            totalVehicles > 0 ? (activeFleet / totalVehicles) * 100 : 0

        const insights: Insight[] = []

        // Rule 1: High maintenance count
        if (maintenanceCount > 3) {
            insights.push({
                type: 'danger',
                message: `${maintenanceCount} vehicles in maintenance — service backlog detected. Consider scheduling additional service capacity.`,
            })
        } else if (maintenanceCount > 0) {
            insights.push({
                type: 'warning',
                message: `${maintenanceCount} vehicle${maintenanceCount > 1 ? 's' : ''} currently in maintenance bay.`,
            })
        }

        // Rule 2: Fleet underutilization
        if (utilizationRate < 50 && totalVehicles > 0) {
            insights.push({
                type: 'warning',
                message: `Fleet utilization at ${Math.round(utilizationRate)}% — fleet is underutilized. Consider optimizing dispatch schedules.`,
            })
        }

        // Rule 3: Pending cargo backlog
        if (pendingTrips > 5) {
            insights.push({
                type: 'danger',
                message: `${pendingTrips} trips are in DRAFT status — cargo backlog detected. Dispatch more vehicles immediately.`,
            })
        } else if (pendingTrips > 0) {
            insights.push({
                type: 'info',
                message: `${pendingTrips} pending trip${pendingTrips > 1 ? 's' : ''} awaiting dispatch.`,
            })
        }

        // Rule 4: Good activity signal
        if (recentTrips > 5) {
            insights.push({
                type: 'info',
                message: `${recentTrips} trips completed this week — fleet operations running smoothly.`,
            })
        }

        // Rule 5: No vehicles
        if (totalVehicles === 0) {
            insights.push({
                type: 'info',
                message: 'No vehicles registered yet. Add vehicles to start dispatching trips.',
            })
        }

        // Rule 6: High utilization — potential risk
        if (utilizationRate > 90 && totalVehicles > 0) {
            insights.push({
                type: 'warning',
                message: `Fleet utilization at ${Math.round(utilizationRate)}% — operating near capacity. Monitor vehicle availability closely.`,
            })
        }

        res.json({ insights })
    } catch (err) {
        console.error('[AI Insights] Error:', err)
        res.status(500).json({ error: 'Failed to generate insights.' })
    }
}
