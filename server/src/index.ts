import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import aiInsightsRoutes from './routes/aiInsightsRoutes'
import vehicleRoutes from './routes/vehicleRoutes'
import tripRoutes from './routes/tripRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 4000

// ─────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

// Health check (public)
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'FleetFlow API', timestamp: new Date().toISOString() })
})

// Auth routes (register, login, me) — public
app.use('/api/auth', authRoutes)

// Dashboard — manager only
app.use('/api/dashboard', dashboardRoutes)

// AI Insights — any authenticated user
app.use('/api/ai-insights', aiInsightsRoutes)

// Vehicles CRUD
app.use('/api/vehicles', vehicleRoutes)

// Trips CRUD
app.use('/api/trips', tripRoutes)

// ─────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FleetFlow API → http://localhost:${PORT}`)
    console.log(`   POST /api/auth/register`)
    console.log(`   POST /api/auth/login`)
    console.log(`   GET  /api/auth/me`)
    console.log(`   GET  /api/dashboard`)
    console.log(`   GET  /api/ai-insights`)
    console.log(`   GET  /api/vehicles`)
    console.log(`   POST /api/vehicles`)
})

export default app
