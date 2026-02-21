import { authService } from './authService'

const API = '/api'

export interface TripOption {
    id: string
    tripNumber: number
    origin: string
    destination: string
    driver: { id: string; fullName: string } | null
    vehicle: { id: string; plateNumber: string } | null
    estimatedFuelCost: number | null
}

export interface Expense {
    id: string
    tripId: string
    trip: { tripNumber: number; origin: string; destination: string; status: string }
    driver: { fullName: string } | null
    vehicle: { plateNumber: string; make: string; model: string } | null
    fuelLiters: number | null
    fuelCost: number
    miscExpense: number
    totalCost: number
    notes: string | null
    createdAt: string
}

export interface CreateExpensePayload {
    tripId: string
    driverId?: string
    vehicleId?: string
    fuelLiters?: number
    fuelCost: number
    miscExpense?: number
    notes?: string
}

function headers(): HeadersInit {
    const token = authService.getStoredToken()
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export const expenseService = {
    async getAll(): Promise<Expense[]> {
        const res = await fetch(`${API}/expenses`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load expenses.')
        return data.expenses
    },

    async getCompletedTrips(): Promise<TripOption[]> {
        const res = await fetch(`${API}/expenses/completed-trips`, { headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load trips.')
        return data.trips
    },

    async create(payload: CreateExpensePayload): Promise<Expense> {
        const res = await fetch(`${API}/expenses`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create expense.')
        return data.expense
    },

    async delete(id: string): Promise<void> {
        const res = await fetch(`${API}/expenses/${id}`, { method: 'DELETE', headers: headers() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to delete expense.')
    },
}
