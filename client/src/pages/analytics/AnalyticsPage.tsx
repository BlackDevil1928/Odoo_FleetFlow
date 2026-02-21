import React, { useEffect, useState, useCallback } from 'react'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Loader2, Download, RefreshCw, TrendingUp, DollarSign, Activity, BarChart2, Lightbulb } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { analyticsService, type AnalyticsPayload } from '@/services/analyticsService'
import jsPDF from 'jspdf'

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const INR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

// ─────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────
interface KpiCardProps {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    accent: string
}
const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, accent }) => (
    <div className={`rounded-2xl border bg-[hsl(222,40%,8%)] p-5 flex flex-col gap-3 ${accent}`}>
        <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">{label}</span>
            <span className="opacity-60">{icon}</span>
        </div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
)

// ─────────────────────────────────────────────────────────
// CHART TOOLTIP STYLE
// ─────────────────────────────────────────────────────────
const tooltipStyle = {
    contentStyle: {
        background: 'hsl(222,40%,9%)',
        border: '1px solid hsl(217,32%,16%)',
        borderRadius: '10px',
        color: '#cbd5e1',
        fontSize: 12,
    },
    labelStyle: { color: '#94a3b8' },
}

// ─────────────────────────────────────────────────────────
// ANALYTICS PAGE
// ─────────────────────────────────────────────────────────
const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<AnalyticsPayload | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [exportMsg, setExportMsg] = useState('')

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const payload = await analyticsService.get()
            setData(payload)
        } catch {
            // silent on error — user sees placeholder
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const handleExport = async () => {
        if (!data) return
        setExporting(true)
        try {
            const doc = new jsPDF()
            const { kpis, insights } = data

            doc.setFontSize(18)
            doc.setTextColor(30, 40, 60)
            doc.text('FleetFlow — Analytics Report', 20, 20)
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 28)

            doc.setFontSize(13)
            doc.setTextColor(40)
            doc.text('KPI Summary', 20, 42)

            const rows = [
                ['Fleet Utilization', `${kpis.fleetUtilization}%`],
                ['Total Operational Cost', INR(kpis.totalOperationalCost)],
                ['Total Fuel Cost', INR(kpis.totalFuelCost)],
                ['Avg Fuel Efficiency', `${kpis.avgFuelEfficiency} km/L`],
                ['Fleet ROI', `+${kpis.fleetROI}%`],
                ['Active Vehicles', `${kpis.activeVehicles} / ${kpis.totalVehicles}`],
            ]

            let y = 52
            doc.setFontSize(10)
            rows.forEach(([label, val]) => {
                doc.setTextColor(80)
                doc.text(label, 20, y)
                doc.setTextColor(30)
                doc.text(val, 120, y)
                y += 8
            })

            y += 8
            doc.setFontSize(13)
            doc.setTextColor(40)
            doc.text('AI Insights', 20, y)
            y += 8
            doc.setFontSize(10)
            insights.forEach((ins) => {
                doc.setTextColor(80)
                doc.text(`• ${ins}`, 20, y)
                y += 7
            })

            doc.save('fleetflow-analytics.pdf')
            setExportMsg('PDF exported successfully!')
            setTimeout(() => setExportMsg(''), 4000)
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                </div>
            </AppShell>
        )
    }

    const kpis = data?.kpis
    const monthly = data?.monthlyData ?? []
    const dist = data?.costDistribution ?? []
    const insights = data?.insights ?? []

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-6">

                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-100">Operational Analytics & Reports</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Real-time fleet performance insights</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {exportMsg && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                {exportMsg}
                            </span>
                        )}
                        <button onClick={load}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[hsl(217,32%,16%)] text-slate-400 hover:text-slate-200 text-sm transition-colors">
                            <RefreshCw size={13} />
                            Refresh
                        </button>
                        <button onClick={handleExport} disabled={exporting || !data}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                            Export PDF
                        </button>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard
                        icon={<Activity size={18} className="text-emerald-400" />}
                        label="Fleet Utilization"
                        value={`${kpis?.fleetUtilization ?? 0}%`}
                        sub={`${kpis?.activeVehicles ?? 0} of ${kpis?.totalVehicles ?? 0} vehicles active`}
                        accent="border-emerald-500/20"
                    />
                    <KpiCard
                        icon={<DollarSign size={18} className="text-amber-400" />}
                        label="Total Operational Cost"
                        value={INR(kpis?.totalOperationalCost ?? 0)}
                        sub={`Fuel: ${INR(kpis?.totalFuelCost ?? 0)}`}
                        accent="border-amber-500/20"
                    />
                    <KpiCard
                        icon={<TrendingUp size={18} className="text-blue-400" />}
                        label="Avg Fuel Efficiency"
                        value={`${kpis?.avgFuelEfficiency ?? 0} km/L`}
                        sub="Fleet-wide average"
                        accent="border-blue-500/20"
                    />
                    <KpiCard
                        icon={<BarChart2 size={18} className="text-purple-400" />}
                        label="Fleet ROI"
                        value={`+${kpis?.fleetROI ?? 0}%`}
                        sub="Revenue vs. costs"
                        accent="border-purple-500/20"
                    />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Fuel Efficiency Trend — Line */}
                    <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] p-5">
                        <h3 className="text-sm font-semibold text-slate-200 mb-4">Fuel Efficiency Trend (km/L)</h3>
                        {monthly.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,32%,14%)" />
                                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} L`, 'Fuel']} />
                                    <Line type="monotone" dataKey="fuelLiters" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Fuel (L)" />
                                    <Line type="monotone" dataKey="fuelCost" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="Fuel Cost" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Fleet Utilization — Bar */}
                    <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] p-5">
                        <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Costs (₹)</h3>
                        {monthly.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={monthly} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,32%,14%)" />
                                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tooltipStyle} formatter={(v: number) => [INR(v), '']} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                    <Bar dataKey="fuelCost" name="Fuel" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="maintenanceCost" name="Maintenance" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Bottom row: Pie + Monthly Table + AI Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Cost Distribution — Pie */}
                    <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] p-5">
                        <h3 className="text-sm font-semibold text-slate-200 mb-4">Fleet by Vehicle Type</h3>
                        {dist.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={dist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                                        {dist.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} formatter={(v: number, _n: string, entry: any) => [v, entry.payload?.name]} />
                                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Financial Summary Table */}
                    <div className="lg:col-span-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)]">
                            <h3 className="text-sm font-semibold text-slate-200">Financial Summary of Month</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-[hsl(217,32%,14%)]">
                                        {['Month', 'Revenue', 'Fuel Cost', 'Maintenance', 'Net Profit'].map((h) => (
                                            <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthly.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-slate-600">No data</td></tr>
                                    ) : monthly.map((m) => (
                                        <tr key={m.month} className="border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors">
                                            <td className="px-4 py-2.5 text-slate-400 font-medium">{m.month}</td>
                                            <td className="px-4 py-2.5 text-emerald-400">{INR(m.revenue)}</td>
                                            <td className="px-4 py-2.5 text-amber-400">{INR(m.fuelCost)}</td>
                                            <td className="px-4 py-2.5 text-red-400">{INR(m.maintenanceCost)}</td>
                                            <td className={`px-4 py-2.5 font-semibold ${m.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {m.netProfit >= 0 ? '+' : ''}{INR(m.netProfit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AI Insight Panel */}
                    <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Lightbulb size={14} className="text-amber-400" />
                            <h3 className="text-sm font-semibold text-slate-200">AI Insights</h3>
                        </div>
                        {insights.length === 0 ? (
                            <p className="text-sm text-slate-600">No insights available.</p>
                        ) : insights.map((ins, i) => (
                            <div key={i} className="rounded-xl bg-[hsl(222,40%,10%)] border border-[hsl(217,32%,16%)] px-4 py-3 text-sm text-slate-300 leading-relaxed">
                                {ins}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AppShell>
    )
}

export default AnalyticsPage
