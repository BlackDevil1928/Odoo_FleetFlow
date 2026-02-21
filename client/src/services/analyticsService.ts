import { authService } from './authService'

const API = '/api'

export interface AnalyticsKPIs {
    fleetUtilization: number
    totalOperationalCost: number
    totalFuelCost: number
    avgFuelEfficiency: number
    fleetROI: number
    totalVehicles: number
    activeVehicles: number
}

export interface MonthlyData {
    month: string
    fuelCost: number
    maintenanceCost: number
    totalCost: number
    revenue: number
    netProfit: number
    fuelLiters: number
}

export interface CostDistribution {
    name: string
    value: number
}

export interface AnalyticsPayload {
    kpis: AnalyticsKPIs
    monthlyData: MonthlyData[]
    costDistribution: CostDistribution[]
    insights: string[]
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export const analyticsService = {
    async get(): Promise<AnalyticsPayload> {
        const res = await fetch(`${API}/analytics`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load analytics.')
        return data
    },
}
