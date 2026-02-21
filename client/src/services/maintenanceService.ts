import { authService } from './authService'

const API = '/api'

export type ServiceLogStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED'

export interface ServiceLog {
    id: string
    logNumber: number
    vehicleId: string
    vehicle?: { plateNumber: string; make: string; model: string; type: string }
    issue: string
    cost: number | null
    status: ServiceLogStatus
    serviceDate: string
    resolvedAt: string | null
    notes: string | null
    createdAt: string
}

export interface ServiceVehicle {
    id: string
    plateNumber: string
    make: string
    model: string
    type: string
    status: string
}

export interface CreateServiceLogPayload {
    vehicleId: string
    issue: string
    cost?: number
    serviceDate?: string
    notes?: string
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export const maintenanceService = {
    async getAll(): Promise<ServiceLog[]> {
        const res = await fetch(`${API}/maintenance`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load service logs.')
        return data.logs
    },

    async getVehicles(): Promise<ServiceVehicle[]> {
        const res = await fetch(`${API}/maintenance/vehicles`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load vehicles.')
        return data.vehicles
    },

    async create(payload: CreateServiceLogPayload): Promise<ServiceLog> {
        const res = await fetch(`${API}/maintenance`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create service log.')
        return data.log
    },

    async updateStatus(id: string, status: ServiceLogStatus, cost?: number): Promise<ServiceLog> {
        const res = await fetch(`${API}/maintenance/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({ status, ...(cost !== undefined && { cost }) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update log.')
        return data.log
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API}/maintenance/${id}`, {
            method: 'DELETE',
            headers: headers(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to delete log.')
    },
}
