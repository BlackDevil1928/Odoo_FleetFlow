import { create } from 'zustand'
import {
    tripService,
    type Trip,
    type AvailableVehicle,
    type AvailableDriver,
    type CreateTripPayload,
} from '@/services/tripService'
import { useDashboardStore } from './dashboardStore'

interface TripState {
    trips: Trip[]
    availableVehicles: AvailableVehicle[]
    availableDrivers: AvailableDriver[]
    isLoading: boolean
    resourcesLoading: boolean
    error: string | null

    fetchTrips: () => Promise<void>
    fetchResources: () => Promise<void>
    dispatchTrip: (payload: CreateTripPayload) => Promise<void>
    removeTrip: (id: string) => Promise<void>
}

export const useTripStore = create<TripState>((set) => ({
    trips: [],
    availableVehicles: [],
    availableDrivers: [],
    isLoading: false,
    resourcesLoading: false,
    error: null,

    fetchTrips: async () => {
        set({ isLoading: true, error: null })
        try {
            const trips = await tripService.getAll()
            set({ trips, isLoading: false })
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false })
        }
    },

    fetchResources: async () => {
        set({ resourcesLoading: true })
        try {
            const { vehicles, drivers } = await tripService.getAvailableResources()
            set({ availableVehicles: vehicles, availableDrivers: drivers, resourcesLoading: false })
        } catch {
            set({ resourcesLoading: false })
        }
    },

    dispatchTrip: async (payload) => {
        const trip = await tripService.create(payload)
        set((s) => ({ trips: [trip, ...s.trips] }))
        // Refresh dashboard KPIs
        useDashboardStore.getState().triggerRefresh()
    },

    removeTrip: async (id) => {
        await tripService.delete(id)
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }))
        useDashboardStore.getState().triggerRefresh()
    },
}))
