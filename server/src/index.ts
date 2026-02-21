import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import http from 'http'
import { Server as SocketServer } from 'socket.io'

import authRoutes from './routes/authRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import aiInsightsRoutes from './routes/aiInsightsRoutes'
import vehicleRoutes from './routes/vehicleRoutes'
import tripRoutes from './routes/tripRoutes'
import maintenanceRoutes from './routes/maintenanceRoutes'
import expenseRoutes from './routes/expenseRoutes'
import driverRoutes from './routes/driverRoutes'
import analyticsRoutes from './routes/analyticsRoutes'
import trackingRoutes from './routes/trackingRoutes'

import { buildFleetPositions } from './controllers/tracking.controller'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 4000

// ─────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARE  (unchanged)
// ─────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// ─────────────────────────────────────────────────────────
// ROUTES  (all existing routes unchanged)
// ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FleetFlow API', timestamp: new Date().toISOString() })
})
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ai-insights', aiInsightsRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/trips', tripRoutes)
app.use('/api/maintenance', maintenanceRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/drivers', driverRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/tracking', trackingRoutes)

// ─────────────────────────────────────────────────────────
// HTTP SERVER + SOCKET.IO
// Socket.io wraps the same HTTP server — zero impact on REST routes.
// ─────────────────────────────────────────────────────────
const httpServer = http.createServer(app)

const io = new SocketServer(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

io.on('connection', async (socket) => {
    console.log(`[Socket] client connected: ${socket.id}`)

    // Immediately send the current fleet snapshot to the newly joined client
    try {
        const positions = await buildFleetPositions()
        socket.emit('fleet:positions', positions)
    } catch (err) {
        console.error('[Socket] initial snapshot error:', err)
    }

    socket.on('disconnect', () => {
        console.log(`[Socket] client disconnected: ${socket.id}`)
    })
})

// Broadcast fleet positions to ALL clients every 4 seconds
setInterval(async () => {
    if (io.engine.clientsCount === 0) return   // skip if nobody is watching
    try {
        const positions = await buildFleetPositions()
        io.emit('fleet:positions', positions)
    } catch (err) {
        console.error('[Socket] broadcast error:', err)
    }
}, 4000)

// ─────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`🚀 FleetFlow API  → http://localhost:${PORT}`)
    console.log(`🔌 Socket.io      → ws://localhost:${PORT}`)
    console.log(`📡 Fleet tracking → GET /api/tracking`)
})

export default app
