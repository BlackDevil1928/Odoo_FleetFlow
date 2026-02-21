import { authService } from './authService'

const API = '/api'

export interface RecentTrip {
    id: string
    tripNumber: number
    status: 'DRAFT' | 'DISPATCHED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
    origin: string
    destination: string
    cargo: string | null
    vehicle: { plateNumber: string; make: string; model: string } | null
    driver: { fullName: string } | null
    createdAt: string
}

export interface DashboardData {
    activeFleet: number
    maintenanceAlerts: number
    pendingCargo: number
    utilizationRate: number
    totalVehicles: number
    recentTrips: RecentTrip[]
}

export interface Insight {
    type: 'warning' | 'info' | 'danger'
    message: string
}

function getAuthHeaders(): HeadersInit {
    const token = authService.getStoredToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export const dashboardService = {
    async getDashboard(): Promise<DashboardData> {
        const res = await fetch(`${API}/dashboard`, {
            headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load dashboard.')
        return data
    },

    async getAiInsights(): Promise<Insight[]> {
        const res = await fetch(`${API}/ai-insights`, {
            headers: getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load insights.')
        return data.insights ?? []
    },
}
