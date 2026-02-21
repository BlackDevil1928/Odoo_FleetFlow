import { authService } from './authService'

const API = '/api'

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'

export interface Vehicle {
    id: string
    plateNumber: string
    make: string
    model: string
    year: number
    type: string
    status: VehicleStatus
    fuelLevel: number | null
    mileage: number | null
    maxPayload: number | null
    createdAt: string
    updatedAt: string
}

export interface CreateVehiclePayload {
    plateNumber: string
    make?: string
    model: string
    year?: number
    type?: string
    mileage?: number
    maxPayload?: number
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export const vehicleService = {
    async getAll(): Promise<Vehicle[]> {
        const res = await fetch(`${API}/vehicles`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load vehicles.')
        return data.vehicles
    },

    async create(payload: CreateVehiclePayload): Promise<Vehicle> {
        const res = await fetch(`${API}/vehicles`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create vehicle.')
        return data.vehicle
    },

    async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
        const res = await fetch(`${API}/vehicles/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({ status }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update vehicle.')
        return data.vehicle
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API}/vehicles/${id}`, {
            method: 'DELETE',
            headers: headers(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to delete vehicle.')
    },
}
