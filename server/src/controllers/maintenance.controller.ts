import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────
// GET /api/maintenance
// ─────────────────────────────────────────────────────────
export const getServiceLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = await prisma.serviceLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: { select: { plateNumber: true, make: true, model: true, type: true } },
            },
        })
        res.json({ logs })
    } catch (err) {
        console.error('[Maintenance] getServiceLogs:', err)
        res.status(500).json({ error: 'Failed to fetch service logs.' })
    }
}

// ─────────────────────────────────────────────────────────
// POST /api/maintenance
// Creates a service log AND marks vehicle as IN_SHOP
// ─────────────────────────────────────────────────────────
export const createServiceLog = async (req: Request, res: Response): Promise<void> => {
    const { vehicleId, issue, cost, serviceDate, notes } = req.body

    if (!vehicleId || !issue) {
        res.status(400).json({ error: 'Vehicle and issue/service are required.' })
        return
    }

    try {
        const [log] = await prisma.$transaction(async (tx) => {
            // Auto-hide rule: mark vehicle as IN_SHOP
            await tx.vehicle.update({
                where: { id: vehicleId },
                data: { status: 'IN_SHOP' },
            })

            const newLog = await tx.serviceLog.create({
                data: {
                    vehicleId,
                    issue,
                    cost: cost ? Number(cost) : null,
                    serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
                    notes: notes ?? null,
                    status: 'NEW',
                },
                include: {
                    vehicle: { select: { plateNumber: true, make: true, model: true, type: true } },
                },
            })

            return [newLog]
        })

        res.status(201).json({ log })
    } catch (err: any) {
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Vehicle not found.' })
        } else {
            console.error('[Maintenance] createServiceLog:', err)
            res.status(500).json({ error: 'Failed to create service log.' })
        }
    }
}

// ─────────────────────────────────────────────────────────
// PATCH /api/maintenance/:id  — update status / resolve
// ─────────────────────────────────────────────────────────
export const updateServiceLog = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { status, cost, notes } = req.body

    try {
        const existing = await prisma.serviceLog.findUnique({ where: { id } })
        if (!existing) { res.status(404).json({ error: 'Log not found.' }); return }

        const updated = await prisma.$transaction(async (tx) => {
            const log = await tx.serviceLog.update({
                where: { id },
                data: {
                    ...(status !== undefined && { status }),
                    ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
                    ...(cost !== undefined && { cost: Number(cost) }),
                    ...(notes !== undefined && { notes }),
                },
            })

            // If resolved → free the vehicle
            if (status === 'RESOLVED' && existing.vehicleId) {
                await tx.vehicle.update({
                    where: { id: existing.vehicleId },
                    data: { status: 'AVAILABLE' },
                })
            }

            return log
        })

        res.json({ log: updated })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Log not found.' }); return }
        console.error('[Maintenance] updateServiceLog:', err)
        res.status(500).json({ error: 'Failed to update log.' })
    }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/maintenance/:id
// ─────────────────────────────────────────────────────────
export const deleteServiceLog = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        await prisma.serviceLog.delete({ where: { id } })
        res.json({ message: 'Service log deleted.' })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Log not found.' }); return }
        console.error('[Maintenance] deleteServiceLog:', err)
        res.status(500).json({ error: 'Failed to delete log.' })
    }
}

// ─────────────────────────────────────────────────────────
// GET /api/maintenance/vehicles
// Returns all vehicles for the form dropdown
// ─────────────────────────────────────────────────────────
export const getVehiclesForForm = async (_req: Request, res: Response): Promise<void> => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { plateNumber: 'asc' },
            select: { id: true, plateNumber: true, make: true, model: true, type: true, status: true },
        })
        res.json({ vehicles })
    } catch (err) {
        console.error('[Maintenance] getVehiclesForForm:', err)
        res.status(500).json({ error: 'Failed to fetch vehicles.' })
    }
}
