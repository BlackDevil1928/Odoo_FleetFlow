import { authService } from './authService'

const API = '/api'

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'

export interface Trip {
    id: string
    tripNumber: number
    status: TripStatus
    origin: string
    destination: string
    cargo: string | null
    cargoWeight: number | null
    estimatedFuelCost: number | null
    vehicle: { plateNumber: string; make: string; model: string; type: string } | null
    driver: { fullName: string } | null
    startedAt: string | null
    completedAt: string | null
    createdAt: string
}

export interface AvailableVehicle {
    id: string
    plateNumber: string
    make: string
    model: string
    type: string
    maxPayload: number | null
}

export interface AvailableDriver {
    id: string
    fullName: string
    licenseNo: string | null
}

export interface CreateTripPayload {
    vehicleId?: string
    driverId?: string
    origin: string
    destination: string
    cargo?: string
    cargoWeight?: number
    estimatedFuelCost?: number
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export const tripService = {
    async getAll(): Promise<Trip[]> {
        const res = await fetch(`${API}/trips`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load trips.')
        return data.trips
    },

    async getAvailableResources(): Promise<{ vehicles: AvailableVehicle[]; drivers: AvailableDriver[] }> {
        const res = await fetch(`${API}/trips/available-resources`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load resources.')
        return data
    },

    async create(payload: CreateTripPayload): Promise<Trip> {
        const res = await fetch(`${API}/trips`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create trip.')
        return data.trip
    },

    async updateStatus(id: string, status: TripStatus): Promise<Trip> {
        const res = await fetch(`${API}/trips/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({ status }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update trip.')
        return data.trip
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API}/trips/${id}`, {
            method: 'DELETE',
            headers: headers(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to delete trip.')
    },
}
