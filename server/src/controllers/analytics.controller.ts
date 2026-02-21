import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/analytics
export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [vehicles, trips, expenses, serviceLogs] = await Promise.all([
            prisma.vehicle.findMany({ select: { id: true, status: true, type: true, mileage: true } }),
            prisma.trip.findMany({
                select: {
                    id: true, status: true, startedAt: true, completedAt: true,
                    estimatedFuelCost: true, cargoWeight: true,
                    vehicle: { select: { type: true } },
                },
            }),
            prisma.expense.findMany({ select: { fuelCost: true, miscExpense: true, totalCost: true, fuelLiters: true, createdAt: true } }),
            prisma.serviceLog.findMany({ select: { cost: true, createdAt: true, status: true } }),
        ])

        const totalVehicles = vehicles.length
        const activeVehicles = vehicles.filter((v) => v.status === 'ON_TRIP').length
        const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0

        const totalFuelCost = expenses.reduce((s, e) => s + e.fuelCost, 0)
        const totalMiscCost = expenses.reduce((s, e) => s + e.miscExpense, 0)
        const totalMaintenanceCost = serviceLogs.reduce((s, l) => s + (l.cost ?? 0), 0)
        const totalOperationalCost = totalFuelCost + totalMiscCost + totalMaintenanceCost

        const totalFuelLiters = expenses.reduce((s, e) => s + (e.fuelLiters ?? 0), 0)
        const avgFuelEfficiency = totalFuelLiters > 0
            ? Math.round(((vehicles.reduce((s, v) => s + (v.mileage ?? 0), 0)) / totalFuelLiters) * 10) / 10
            : 0

        // Monthly breakdown (last 6 months)
        const now = new Date()
        const monthlyData = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
            const label = d.toLocaleString('en-IN', { month: 'short' })

            const monthExp = expenses.filter((e) => {
                const t = new Date(e.createdAt)
                return t >= d && t < next
            })
            const monthSvc = serviceLogs.filter((l) => {
                const t = new Date(l.createdAt)
                return t >= d && t < next
            })

            const fuelCost = monthExp.reduce((s, e) => s + e.fuelCost, 0)
            const maintenanceCost = monthSvc.reduce((s, l) => s + (l.cost ?? 0), 0)
            const revenue = monthExp.reduce((s, e) => s + e.totalCost * 1.3, 0) // estimated
            const fuelLiters = monthExp.reduce((s, e) => s + (e.fuelLiters ?? 0), 0)

            return {
                month: label,
                fuelCost: Math.round(fuelCost),
                maintenanceCost: Math.round(maintenanceCost),
                totalCost: Math.round(fuelCost + maintenanceCost),
                revenue: Math.round(revenue),
                netProfit: Math.round(revenue - fuelCost - maintenanceCost),
                fuelLiters: Math.round(fuelLiters * 10) / 10,
            }
        })

        // Vehicle type distribution for pie chart
        const typeCounts: Record<string, number> = {}
        vehicles.forEach((v) => {
            typeCounts[v.type] = (typeCounts[v.type] ?? 0) + 1
        })
        const costDistribution = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

        // AI Insights
        const insights: string[] = []
        const last2 = monthlyData.slice(-2)
        if (last2.length === 2 && last2[1].fuelCost > last2[0].fuelCost * 1.1) {
            insights.push('⚠️ Fuel usage increasing — costs up over 10% vs last month.')
        }
        if (fleetUtilization < 40) {
            insights.push('📦 Underutilized fleet detected — consider reassigning idle vehicles.')
        }
        if (totalMaintenanceCost > totalFuelCost * 0.5) {
            insights.push('🔧 Vehicle maintenance cost rising — review In-Shop vehicles.')
        }
        if (insights.length === 0) {
            insights.push('✅ Fleet is operating efficiently. No critical alerts.')
        }

        const fleetROI = totalOperationalCost > 0
            ? Math.round(((totalOperationalCost * 1.3 - totalOperationalCost) / totalOperationalCost) * 100)
            : 0

        res.json({
            kpis: {
                fleetUtilization,
                totalOperationalCost: Math.round(totalOperationalCost),
                totalFuelCost: Math.round(totalFuelCost),
                avgFuelEfficiency,
                fleetROI,
                totalVehicles,
                activeVehicles,
            },
            monthlyData,
            costDistribution,
            insights,
        })
    } catch (err) {
        console.error('[Analytics] getAnalytics:', err)
        res.status(500).json({ error: 'Failed to fetch analytics.' })
    }
}
