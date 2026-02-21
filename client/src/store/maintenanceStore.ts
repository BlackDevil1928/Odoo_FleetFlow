import { create } from 'zustand'
import {
    maintenanceService,
    type ServiceLog,
    type ServiceVehicle,
    type CreateServiceLogPayload,
} from '@/services/maintenanceService'
import { useDashboardStore } from './dashboardStore'

interface MaintenanceState {
    logs: ServiceLog[]
    vehicles: ServiceVehicle[]
    isLoading: boolean
    vehiclesLoading: boolean
    error: string | null

    fetchLogs: () => Promise<void>
    fetchVehicles: () => Promise<void>
    createLog: (payload: CreateServiceLogPayload) => Promise<void>
    resolveLog: (id: string) => Promise<void>
    removeLog: (id: string) => Promise<void>
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
    logs: [],
    vehicles: [],
    isLoading: false,
    vehiclesLoading: false,
    error: null,

    fetchLogs: async () => {
        set({ isLoading: true, error: null })
        try {
            const logs = await maintenanceService.getAll()
            set({ logs, isLoading: false })
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false })
        }
    },

    fetchVehicles: async () => {
        set({ vehiclesLoading: true })
        try {
            const vehicles = await maintenanceService.getVehicles()
            set({ vehicles, vehiclesLoading: false })
        } catch {
            set({ vehiclesLoading: false })
        }
    },

    createLog: async (payload) => {
        const log = await maintenanceService.create(payload)
        set((s) => ({ logs: [log, ...s.logs] }))
        // Refresh dashboard KPIs (maintenance alert count changes)
        useDashboardStore.getState().triggerRefresh()
    },

    resolveLog: async (id) => {
        const log = await maintenanceService.updateStatus(id, 'RESOLVED')
        set((s) => ({ logs: s.logs.map((l) => (l.id === id ? log : l)) }))
        useDashboardStore.getState().triggerRefresh()
    },

    removeLog: async (id) => {
        await maintenanceService.delete(id)
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }))
        useDashboardStore.getState().triggerRefresh()
    },
}))
