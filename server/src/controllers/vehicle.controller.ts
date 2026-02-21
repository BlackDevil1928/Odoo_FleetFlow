import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────
// GET /api/vehicles
// ─────────────────────────────────────────────────────────
export const getVehicles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
        })
        res.json({ vehicles })
    } catch (err) {
        console.error('[Vehicles] getVehicles error:', err)
        res.status(500).json({ error: 'Failed to fetch vehicles.' })
    }
}

// ─────────────────────────────────────────────────────────
// POST /api/vehicles
// ─────────────────────────────────────────────────────────
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
    const { plateNumber, make, model, year, type, fuelLevel, mileage, maxPayload } = req.body

    if (!plateNumber || !model) {
        res.status(400).json({ error: 'License plate and model are required.' })
        return
    }
    if (maxPayload !== undefined && Number(maxPayload) <= 0) {
        res.status(400).json({ error: 'Max payload must be greater than 0.' })
        return
    }
    if (mileage !== undefined && Number(mileage) < 0) {
        res.status(400).json({ error: 'Odometer must be 0 or greater.' })
        return
    }

    // Check unique plate
    const existing = await prisma.vehicle.findUnique({ where: { plateNumber } })
    if (existing) {
        res.status(409).json({ error: `License plate "${plateNumber}" is already registered.` })
        return
    }

    try {
        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber,
                make: make ?? '',
                model,
                year: year ? Number(year) : new Date().getFullYear(),
                type: type ?? 'Truck',
                status: 'AVAILABLE',
                fuelLevel: fuelLevel !== undefined ? Number(fuelLevel) : 100,
                mileage: mileage !== undefined ? Number(mileage) : 0,
                maxPayload: maxPayload !== undefined ? Number(maxPayload) : null,
            },
        })
        res.status(201).json({ vehicle })
    } catch (err) {
        console.error('[Vehicles] createVehicle error:', err)
        res.status(500).json({ error: 'Failed to create vehicle.' })
    }
}

// ─────────────────────────────────────────────────────────
// PATCH /api/vehicles/:id
// ─────────────────────────────────────────────────────────
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { status, mileage, fuelLevel, maxPayload, type, model, make } = req.body

    try {
        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                ...(status !== undefined && { status }),
                ...(mileage !== undefined && { mileage: Number(mileage) }),
                ...(fuelLevel !== undefined && { fuelLevel: Number(fuelLevel) }),
                ...(maxPayload !== undefined && { maxPayload: Number(maxPayload) }),
                ...(type !== undefined && { type }),
                ...(model !== undefined && { model }),
                ...(make !== undefined && { make }),
            },
        })
        res.json({ vehicle })
    } catch (err: any) {
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Vehicle not found.' })
        } else {
            console.error('[Vehicles] updateVehicle error:', err)
            res.status(500).json({ error: 'Failed to update vehicle.' })
        }
    }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/vehicles/:id
// ─────────────────────────────────────────────────────────
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        await prisma.vehicle.delete({ where: { id } })
        res.json({ message: 'Vehicle deleted.' })
    } catch (err: any) {
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Vehicle not found.' })
        } else {
            console.error('[Vehicles] deleteVehicle error:', err)
            res.status(500).json({ error: 'Failed to delete vehicle.' })
        }
    }
}
