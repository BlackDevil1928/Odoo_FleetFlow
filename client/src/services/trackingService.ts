import { io as socketIO, type Socket } from 'socket.io-client'
import { authService } from './authService'

const API = '/api'

export interface VehiclePosition {
    tripId: string
    tripNumber: number
    status: 'IN_TRANSIT' | 'DISPATCHED'
    origin: string
    destination: string
    lat: number
    lng: number
    progressPct: number
    distanceKm: number
    etaMinutes: number
    totalKm: number
    driver: { id: string; fullName: string } | null
    vehicle: { id: string; plateNumber: string; make: string; model: string; type: string } | null
    startedAt: string | null
}

function authHeaders(): HeadersInit {
    const token = authService.getStoredToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export const trackingService = {
    /** HTTP snapshot — used on first render before socket connects. */
    async getSnapshot(): Promise<VehiclePosition[]> {
        const res = await fetch(`${API}/tracking`, { headers: authHeaders() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load fleet positions.')
        return data.positions
    },

    /** Create a Socket.io client connected to the backend.
     *  Caller is responsible for calling socket.disconnect() on cleanup. */
    createSocket(): Socket {
        return socketIO('http://localhost:4000', {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
        })
    },
}
