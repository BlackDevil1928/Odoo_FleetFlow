import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { interpolatePosition } from '../services/tracking.service'

const prisma = new PrismaClient()

export interface VehiclePosition {
    tripId: string
    tripNumber: number
    status: string
    origin: string
    destination: string
    lat: number
    lng: number
    progressPct: number
    distanceKm: number
    etaMinutes: number
    totalKm: number
    driver: { id: string; fullName: string } | null
    vehicle: { id: string; plateNumber: string; make: string; model: string; type: string } | null
    startedAt: string | null
}

/** HTTP GET /api/tracking — returns current fleet snapshot (for initial page load). */
export async function getFleetSnapshot(_req: Request, res: Response) {
    try {
        const activeTrips = await prisma.trip.findMany({
            where: { status: { in: ['IN_TRANSIT', 'DISPATCHED'] } },
            include: {
                driver: { select: { id: true, fullName: true } },
                vehicle: { select: { id: true, plateNumber: true, make: true, model: true, type: true } },
            },
        })

        const positions: VehiclePosition[] = activeTrips
            .map((t) => {
                const pos = interpolatePosition(t.origin, t.destination, t.startedAt)
                if (!pos) return null   // skip trips whose cities aren't in India
                return {
                    tripId: t.id,
                    tripNumber: t.tripNumber,
                    status: t.status,
                    origin: t.origin,
                    destination: t.destination,
                    lat: pos.lat,
                    lng: pos.lng,
                    progressPct: pos.progressPct,
                    distanceKm: pos.distanceKm,
                    etaMinutes: pos.etaMinutes,
                    totalKm: pos.totalKm,
                    driver: t.driver,
                    vehicle: t.vehicle,
                    startedAt: t.startedAt?.toISOString() ?? null,
                } satisfies VehiclePosition
            })
            .filter((p): p is VehiclePosition => p !== null)

        res.json({ positions })
    } catch (err) {
        console.error('[Tracking] getFleetSnapshot:', err)
        res.status(500).json({ error: 'Failed to load fleet positions.' })
    }
}

/** Shared snapshot builder for Socket.io broadcaster. */
export async function buildFleetPositions(): Promise<VehiclePosition[]> {
    const activeTrips = await prisma.trip.findMany({
        where: { status: { in: ['IN_TRANSIT', 'DISPATCHED'] } },
        include: {
            driver: { select: { id: true, fullName: true } },
            vehicle: { select: { id: true, plateNumber: true, make: true, model: true, type: true } },
        },
    })

    return activeTrips
        .map((t) => {
            const pos = interpolatePosition(t.origin, t.destination, t.startedAt)
            if (!pos) return null
            return {
                tripId: t.id,
                tripNumber: t.tripNumber,
                status: t.status,
                origin: t.origin,
                destination: t.destination,
                lat: pos.lat,
                lng: pos.lng,
                progressPct: pos.progressPct,
                distanceKm: pos.distanceKm,
                etaMinutes: pos.etaMinutes,
                totalKm: pos.totalKm,
                driver: t.driver,
                vehicle: t.vehicle,
                startedAt: t.startedAt?.toISOString() ?? null,
            } satisfies VehiclePosition
        })
        .filter((p): p is VehiclePosition => p !== null)
}
