import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/drivers/performance
// Returns drivers with computed safety scores and trip stats
export const getDriverPerformance = async (_req: Request, res: Response): Promise<void> => {
    try {
        const drivers = await prisma.driver.findMany({
            orderBy: { fullName: 'asc' },
            include: {
                _count: { select: { trips: true } },
            },
        })

        const result = drivers.map((d) => {
            const tripsCompleted = d._count.trips
            const safetyScore = Math.max(0,
                (tripsCompleted * 2) - (d.lateTrips * 3) - (d.violations * 5)
            )
            const licenseExpired = d.licenseExpiry
                ? new Date(d.licenseExpiry) < new Date()
                : false

            return {
                id: d.id,
                fullName: d.fullName,
                licenseNo: d.licenseNo,
                licenseExpiry: d.licenseExpiry,
                licenseExpired,
                dutyStatus: d.dutyStatus,
                tripsCompleted,
                lateTrips: d.lateTrips,
                violations: d.violations,
                safetyScore,
                phone: d.phone,
            }
        })

        res.json({ drivers: result })
    } catch (err) {
        console.error('[Drivers] getDriverPerformance:', err)
        res.status(500).json({ error: 'Failed to fetch driver performance.' })
    }
}

// GET /api/drivers — all drivers (for dropdowns)
export const getAllDrivers = async (_req: Request, res: Response): Promise<void> => {
    try {
        const drivers = await prisma.driver.findMany({
            orderBy: { fullName: 'asc' },
            select: {
                id: true, fullName: true, licenseNo: true,
                licenseExpiry: true, dutyStatus: true, phone: true,
            },
        })
        res.json({ drivers })
    } catch (err) {
        console.error('[Drivers] getAllDrivers:', err)
        res.status(500).json({ error: 'Failed to fetch drivers.' })
    }
}

// POST /api/drivers — create driver
export const createDriver = async (req: Request, res: Response): Promise<void> => {
    const { fullName, phone, licenseNo, licenseExpiry } = req.body
    if (!fullName) { res.status(400).json({ error: 'Full name is required.' }); return }

    try {
        const driver = await prisma.driver.create({
            data: {
                fullName,
                phone: phone ?? null,
                licenseNo: licenseNo ?? null,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
            },
        })
        res.status(201).json({ driver })
    } catch (err: any) {
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'License number already exists.' })
        } else {
            console.error('[Drivers] createDriver:', err)
            res.status(500).json({ error: 'Failed to create driver.' })
        }
    }
}

// PATCH /api/drivers/:id — update duty status, violations, lateTrips
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { dutyStatus, violations, lateTrips } = req.body
    try {
        const driver = await prisma.driver.update({
            where: { id },
            data: {
                ...(dutyStatus !== undefined && { dutyStatus }),
                ...(violations !== undefined && { violations: Number(violations) }),
                ...(lateTrips !== undefined && { lateTrips: Number(lateTrips) }),
            },
        })
        res.json({ driver })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Driver not found.' }); return }
        console.error('[Drivers] updateDriver:', err)
        res.status(500).json({ error: 'Failed to update driver.' })
    }
}

// DELETE /api/drivers/:id
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        await prisma.driver.delete({ where: { id } })
        res.json({ message: 'Driver deleted.' })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Driver not found.' }); return }
        console.error('[Drivers] deleteDriver:', err)
        res.status(500).json({ error: 'Failed to delete driver.' })
    }
}
