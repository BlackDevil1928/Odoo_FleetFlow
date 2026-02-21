import { create } from 'zustand'
import { dashboardService, type DashboardData, type Insight } from '@/services/dashboardService'

interface DashboardState {
    data: DashboardData | null
    insights: Insight[]
    isLoading: boolean
    error: string | null
    lastFetched: number | null
    refreshKey: number

    fetchDashboard: () => Promise<void>
    fetchInsights: () => Promise<void>
    triggerRefresh: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
    data: null,
    insights: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    refreshKey: 0,

    fetchDashboard: async () => {
        set({ isLoading: true, error: null })
        try {
            const data = await dashboardService.getDashboard()
            set({ data, isLoading: false, lastFetched: Date.now() })
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false })
        }
    },

    fetchInsights: async () => {
        try {
            const insights = await dashboardService.getAiInsights()
            set({ insights })
        } catch {
            // Silently fail — insights are non-critical
        }
    },

    triggerRefresh: () => {
        set((s) => ({ refreshKey: s.refreshKey + 1 }))
        get().fetchDashboard()
        get().fetchInsights()
    },
}))
