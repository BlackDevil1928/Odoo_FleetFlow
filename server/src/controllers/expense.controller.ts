import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/expenses — all expenses with trip, vehicle, driver
export const getExpenses = async (_req: Request, res: Response): Promise<void> => {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                trip: { select: { tripNumber: true, origin: true, destination: true, status: true } },
                driver: { select: { fullName: true } },
                vehicle: { select: { plateNumber: true, make: true, model: true } },
            },
        })
        res.json({ expenses })
    } catch (err) {
        console.error('[Expenses] getExpenses:', err)
        res.status(500).json({ error: 'Failed to fetch expenses.' })
    }
}

// GET /api/expenses/completed-trips — completed trips without an expense yet
export const getCompletedTrips = async (_req: Request, res: Response): Promise<void> => {
    try {
        const trips = await prisma.trip.findMany({
            where: { status: 'COMPLETED', expense: null },
            orderBy: { completedAt: 'desc' },
            select: {
                id: true,
                tripNumber: true,
                origin: true,
                destination: true,
                driver: { select: { id: true, fullName: true } },
                vehicle: { select: { id: true, plateNumber: true } },
                estimatedFuelCost: true,
            },
        })
        res.json({ trips })
    } catch (err) {
        console.error('[Expenses] getCompletedTrips:', err)
        res.status(500).json({ error: 'Failed to fetch completed trips.' })
    }
}

// POST /api/expenses
export const createExpense = async (req: Request, res: Response): Promise<void> => {
    const { tripId, driverId, vehicleId, fuelLiters, fuelCost, miscExpense, notes } = req.body

    if (!tripId) {
        res.status(400).json({ error: 'Trip ID is required.' })
        return
    }

    const fc = Number(fuelCost ?? 0)
    const mc = Number(miscExpense ?? 0)
    const totalCost = fc + mc

    // Check for existing
    const existing = await prisma.expense.findUnique({ where: { tripId } })
    if (existing) {
        res.status(409).json({ error: 'An expense record already exists for this trip.' })
        return
    }

    try {
        const expense = await prisma.expense.create({
            data: {
                tripId,
                driverId: driverId || null,
                vehicleId: vehicleId || null,
                fuelLiters: fuelLiters ? Number(fuelLiters) : null,
                fuelCost: fc,
                miscExpense: mc,
                totalCost,
                notes: notes ?? null,
            },
            include: {
                trip: { select: { tripNumber: true, origin: true, destination: true, status: true } },
                driver: { select: { fullName: true } },
                vehicle: { select: { plateNumber: true, make: true, model: true } },
            },
        })
        res.status(201).json({ expense })
    } catch (err: any) {
        console.error('[Expenses] createExpense:', err)
        res.status(500).json({ error: 'Failed to create expense.' })
    }
}

// DELETE /api/expenses/:id
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    try {
        await prisma.expense.delete({ where: { id } })
        res.json({ message: 'Expense deleted.' })
    } catch (err: any) {
        if (err.code === 'P2025') { res.status(404).json({ error: 'Expense not found.' }); return }
        console.error('[Expenses] deleteExpense:', err)
        res.status(500).json({ error: 'Failed to delete expense.' })
    }
}
