import { authService } from './authService'

const API = '/api'

export type DriverDutyStatus = 'ON_DUTY' | 'OFF_DUTY' | 'SUSPENDED'

export interface DriverPerf {
    id: string
    fullName: string
    licenseNo: string | null
    licenseExpiry: string | null
    licenseExpired: boolean
    dutyStatus: DriverDutyStatus
    tripsCompleted: number
    lateTrips: number
    violations: number
    safetyScore: number
    phone: string | null
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export const driverService = {
    async getPerformance(): Promise<DriverPerf[]> {
        const res = await fetch(`${API}/drivers/performance`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load driver performance.')
        return data.drivers
    },

    async updateDriver(id: string, updates: { dutyStatus?: DriverDutyStatus; violations?: number; lateTrips?: number }): Promise<DriverPerf> {
        const res = await fetch(`${API}/drivers/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(updates),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to update driver.')
        return data.driver
    },

    async createDriver(payload: { fullName: string; licenseNo?: string; licenseExpiry?: string; phone?: string }): Promise<void> {
        const res = await fetch(`${API}/drivers`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create driver.')
    },
}
