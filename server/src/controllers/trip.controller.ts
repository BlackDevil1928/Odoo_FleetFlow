import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────
// GET /api/trips
// ─────────────────────────────────────────────────────────
export const getTrips = async (_req: Request, res: Response): Promise<void> => {
    try {
        const trips = await prisma.trip.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: { select: { plateNumber: true, make: true, model: true, type: true, maxPayload: true } },
                driver: { select: { fullName: true } },
            },
        })
        res.json({ trips })
    } catch (err) {
        console.error('[Trips] getTrips:', err)
        res.status(500).json({ error: 'Failed to fetch trips.' })
    }
}

// ─────────────────────────────────────────────────────────
// POST /api/trips  — create & dispatch
// ─────────────────────────────────────────────────────────
export const createTrip = async (req: Request, res: Response): Promise<void> => {
    const { vehicleId, driverId, origin, destination, cargo, cargoWeight, estimatedFuelCost } = req.body

    if (!origin || !destination) {
        res.status(400).json({ error: 'Origin and destination are required.' })
        return
    }

    // Validate vehicle capacity vs cargo weight
    if (vehicleId && cargoWeight) {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
        if (vehicle?.maxPayload && Number(cargoWeight) / 1000 > vehicle.maxPayload) {
            res.status(400).json({
                error: `Too heavy! Vehicle max payload is ${vehicle.maxPayload}t but cargo is ${(Number(cargoWeight) / 1000).toFixed(1)}t.`,
            })
            return
        }
        if (vehicle?.status !== 'AVAILABLE') {
            res.status(400).json({ error: `Vehicle is not available (status: ${vehicle?.status}).` })
            return
        }
    }

    try {
        const [trip] = await prisma.$transaction(async (tx) => {
            const newTrip = await tx.trip.create({
                data: {
                    status: 'DISPATCHED',
                    origin,
                    destination,
                    cargo: cargo ?? (cargoWeight ? `${cargoWeight}kg cargo` : null),
                    vehicleId: vehicleId || null,
                    driverId: driverId || null,
                    startedAt: new Date(),
                    estimatedFuelCost: estimatedFuelCost ? Number(estimatedFuelCost) : null,
                    cargoWeight: cargoWeight ? Number(cargoWeight) : null,
                },
                include: {
                    vehicle: { select: { plateNumber: true, make: true, model: true, type: true } },
                    driver: { select: { fullName: true } },
                },
            })

            // Mark vehicle as ON_TRIP
            if (vehicleId) {
                await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'ON_TRIP' } })
            }

            return [newTrip]
        })

        res.status(201).json({ trip })
    } catch (err) {
        console.error('[Trips] createTrip:', err)
        res.status(500).json({ error: 'Failed to create trip.' })
    }
}

// ─────────────────────────────────────────────────────────
// PATCH /api/trips/:id  — update status
// ─────────────────────────────────────────────────────────
export const updateTrip = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const { status } = req.body

    try {
        const trip = await prisma.trip.findUnique({ where: { id } })
        if (!trip) { res.status(404).json({ error: 'Trip not found.' }); return }

        const updated = await prisma.$transaction(async (tx) => {
            const updatedTrip = await tx.trip.update({
                where: { id },
                data: {
                    status,
                    ...(status === 'COMPLETED' && { completedAt: new Date() }),
                },
            })
            // Free up vehicle when trip completes or cancels
            if ((status === 'COMPLETED' || status === 'CANCELLED') && trip.vehicleId) {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: 'AVAILABLE' },
                })
            }
            return updatedTrip
        })

        res.json({ trip: updated })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Trip not found.' }); return }
        console.error('[Trips] updateTrip:', err)
        res.status(500).json({ error: 'Failed to update trip.' })
    }
}

// ─────────────────────────────────────────────────────────
// DELETE /api/trips/:id
// ─────────────────────────────────────────────────────────
export const deleteTrip = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        const trip = await prisma.trip.findUnique({ where: { id } })
        if (!trip) { res.status(404).json({ error: 'Trip not found.' }); return }

        await prisma.$transaction(async (tx) => {
            await tx.trip.delete({ where: { id } })
            // Free vehicle if it was ON_TRIP for this trip
            if (trip.vehicleId) {
                await tx.vehicle.update({
                    where: { id: trip.vehicleId },
                    data: { status: 'AVAILABLE' },
                })
            }
        })

        res.json({ message: 'Trip deleted.' })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Trip not found.' }); return }
        console.error('[Trips] deleteTrip:', err)
        res.status(500).json({ error: 'Failed to delete trip.' })
    }
}

// ─────────────────────────────────────────────────────────
// GET /api/trips/available-resources
// Returns available vehicles + all drivers for dispatch form
// ─────────────────────────────────────────────────────────
export const getAvailableResources = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [vehicles, drivers] = await Promise.all([
            prisma.vehicle.findMany({
                where: { status: 'AVAILABLE' },
                orderBy: { plateNumber: 'asc' },
            }),
            prisma.driver.findMany({ orderBy: { fullName: 'asc' } }),
        ])
        res.json({ vehicles, drivers })
    } catch (err) {
        console.error('[Trips] getAvailableResources:', err)
        res.status(500).json({ error: 'Failed to fetch resources.' })
    }
}
