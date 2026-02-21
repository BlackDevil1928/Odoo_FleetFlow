import { create } from 'zustand'
import { vehicleService, type Vehicle, type CreateVehiclePayload } from '@/services/vehicleService'
import { useDashboardStore } from './dashboardStore'

interface VehicleState {
    vehicles: Vehicle[]
    isLoading: boolean
    error: string | null

    fetchVehicles: () => Promise<void>
    addVehicle: (payload: CreateVehiclePayload) => Promise<void>
    removeVehicle: (id: string) => Promise<void>
}

export const useVehicleStore = create<VehicleState>((set) => ({
    vehicles: [],
    isLoading: false,
    error: null,

    fetchVehicles: async () => {
        set({ isLoading: true, error: null })
        try {
            const vehicles = await vehicleService.getAll()
            set({ vehicles, isLoading: false })
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false })
        }
    },

    addVehicle: async (payload) => {
        const vehicle = await vehicleService.create(payload)
        set((s) => ({ vehicles: [vehicle, ...s.vehicles] }))
        // Refresh dashboard KPIs after vehicle added
        useDashboardStore.getState().triggerRefresh()
    },

    removeVehicle: async (id) => {
        await vehicleService.delete(id)
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }))
        useDashboardStore.getState().triggerRefresh()
    },
}))
