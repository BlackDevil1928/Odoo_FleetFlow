import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    ChevronDown,
    Plus,
    Truck,
    RefreshCw,
    AlertTriangle,
    Info,
    AlertCircle,
    Zap,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useDashboardStore } from '@/store/dashboardStore'
import type { RecentTrip } from '@/services/dashboardService'

// ─────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    ON_TRIP: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    IN_SHOP: 'bg-red-500/15 text-red-400 border border-red-500/25',
    DRAFT: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
    DISPATCHED: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    IN_TRANSIT: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/25',
}

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
    <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-500/15 text-slate-400'}`}
    >
        {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
)

// ─────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────
interface KpiCardProps {
    label: string
    value: number | string
    sub?: string
    accent?: string
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, accent = 'text-emerald-400' }) => (
    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] p-6 flex flex-col gap-2 min-w-0">
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className={`text-5xl font-bold tracking-tight ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
)

// ─────────────────────────────────────────────────────────
// INSIGHT CARD
// ─────────────────────────────────────────────────────────
const INSIGHT_STYLES = {
    danger: {
        border: 'border-red-500/25',
        bg: 'bg-red-500/8',
        icon: <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />,
        text: 'text-red-300',
    },
    warning: {
        border: 'border-amber-500/25',
        bg: 'bg-amber-500/8',
        icon: <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />,
        text: 'text-amber-300',
    },
    info: {
        border: 'border-blue-500/25',
        bg: 'bg-blue-500/8',
        icon: <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />,
        text: 'text-blue-300',
    },
}

// ─────────────────────────────────────────────────────────
// TRIPS TABLE
// ─────────────────────────────────────────────────────────
const TRIP_HEADERS = ['#', 'Trip', 'Vehicle', 'Driver', 'Status']

interface TripsTableProps {
    trips: RecentTrip[]
    search: string
    filterStatus: string
    sortOrder: 'newest' | 'oldest'
}

const TripsTable: React.FC<TripsTableProps> = ({ trips, search, filterStatus, sortOrder }) => {
    const filtered = trips
        .filter((t) => {
            const q = search.toLowerCase()
            const matchesSearch =
                !q ||
                String(t.tripNumber).includes(q) ||
                (t.driver?.fullName ?? '').toLowerCase().includes(q) ||
                (t.vehicle?.plateNumber ?? '').toLowerCase().includes(q) ||
                t.origin.toLowerCase().includes(q) ||
                t.destination.toLowerCase().includes(q)
            const matchesStatus = !filterStatus || t.status === filterStatus
            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            const da = new Date(a.createdAt).getTime()
            const db = new Date(b.createdAt).getTime()
            return sortOrder === 'newest' ? db - da : da - db
        })

    if (filtered.length === 0) {
        return (
            <div className="text-center py-16 text-slate-500 text-sm">
                {trips.length === 0
                    ? 'No trips found. Create your first trip to get started.'
                    : 'No trips match current filters.'}
            </div>
        )
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-[hsl(217,32%,14%)]">
                    {TRIP_HEADERS.map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {filtered.map((trip) => (
                    <tr
                        key={trip.id}
                        className="border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors"
                    >
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                            #{trip.tripNumber}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 font-medium">
                            <div>{trip.origin} → {trip.destination}</div>
                            {trip.cargo && (
                                <div className="text-xs text-slate-500 mt-0.5">{trip.cargo}</div>
                            )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                            {trip.vehicle
                                ? <span className="font-mono text-xs">{trip.vehicle.plateNumber}</span>
                                : <span className="text-slate-600 italic">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">
                            {trip.driver?.fullName ?? (
                                <span className="text-slate-600 italic">Unassigned</span>
                            )}
                        </td>
                        <td className="px-4 py-3.5">
                            <StatusPill status={trip.status} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

// ─────────────────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30_000 // 30 seconds

const DashboardPage: React.FC = () => {
    const navigate = useNavigate()
    const { data, insights, isLoading, error, fetchDashboard, fetchInsights, triggerRefresh } =
        useDashboardStore()

    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [showSortMenu, setShowSortMenu] = useState(false)

    const load = useCallback(() => {
        fetchDashboard()
        fetchInsights()
    }, [fetchDashboard, fetchInsights])

    // Initial load + polling
    useEffect(() => {
        load()
        const interval = setInterval(load, REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [load])

    // Close dropdowns on outside click
    useEffect(() => {
        const close = () => { setShowFilterMenu(false); setShowSortMenu(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    return (
        <AppShell>
            <div className="min-h-screen flex flex-col p-6 gap-6">

                {/* ── TOP HEADER ─────────────────────────────── */}
                <header className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-[420px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search trips, vehicles, drivers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[hsl(222,40%,8%)] border border-[hsl(217,32%,14%)] rounded-full text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                        />
                    </div>

                    {/* Filter + Sort + Group buttons */}
                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => { setShowFilterMenu((v) => !v); setShowSortMenu(false) }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                            >
                                Filter
                                <ChevronDown size={13} />
                            </button>
                            {showFilterMenu && (
                                <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                    {['', 'DRAFT', 'DISPATCHED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setFilterStatus(s); setShowFilterMenu(false) }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === s ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                        >
                                            {s || 'All Statuses'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort */}
                        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => { setShowSortMenu((v) => !v); setShowFilterMenu(false) }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                            >
                                Sort By
                                <ChevronDown size={13} />
                            </button>
                            {showSortMenu && (
                                <div className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                    {(['newest', 'oldest'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setSortOrder(s); setShowSortMenu(false) }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors capitalize ${sortOrder === s ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                        >
                                            {s === 'newest' ? 'Newest First' : 'Oldest First'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Group — UI only for wireframe */}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                            Group By
                        </button>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Refresh indicator */}
                    <button
                        onClick={triggerRefresh}
                        title="Refresh dashboard"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>

                    {/* Action buttons */}
                    <button
                        onClick={() => navigate('/trips')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} />
                        New Trip
                    </button>
                    <button
                        onClick={() => navigate('/vehicles')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(217,32%,20%)] text-sm text-slate-300 hover:text-white hover:border-slate-400 transition-colors"
                    >
                        <Truck size={15} />
                        New Vehicle
                    </button>
                </header>

                {/* ── ERROR ───────────────────────────────────── */}
                {error && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle size={15} />
                        {error}
                    </div>
                )}

                {/* ── KPI CARDS ───────────────────────────────── */}
                <section className="flex gap-4">
                    <KpiCard
                        label="Active Fleet"
                        value={isLoading && !data ? '—' : (data?.activeFleet ?? 0)}
                        sub="Vehicles currently on trip"
                        accent="text-emerald-400"
                    />
                    <KpiCard
                        label="Maintenance Alert"
                        value={isLoading && !data ? '—' : (data?.maintenanceAlerts ?? 0)}
                        sub="Vehicles in service bay"
                        accent={data && data.maintenanceAlerts > 3 ? 'text-red-400' : 'text-emerald-400'}
                    />
                    <KpiCard
                        label="Pending Cargo"
                        value={isLoading && !data ? '—' : (data?.pendingCargo ?? 0)}
                        sub="Trips awaiting dispatch"
                        accent={data && data.pendingCargo > 5 ? 'text-amber-400' : 'text-emerald-400'}
                    />
                    <KpiCard
                        label="Utilization Rate"
                        value={isLoading && !data ? '—' : `${data?.utilizationRate ?? 0}%`}
                        sub={`${data?.totalVehicles ?? 0} total vehicles`}
                        accent="text-emerald-400"
                    />
                </section>

                {/* ── MAIN CONTENT: TABLE + INSIGHTS ──────────── */}
                <section className="flex gap-4 flex-1 min-h-0">

                    {/* Trips Table */}
                    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">Recent Trips</h2>
                            {filterStatus && (
                                <button
                                    onClick={() => setFilterStatus('')}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Clear filter: {filterStatus}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-auto">
                            {isLoading && !data ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <TripsTable
                                    trips={data?.recentTrips ?? []}
                                    search={search}
                                    filterStatus={filterStatus}
                                    sortOrder={sortOrder}
                                />
                            )}
                        </div>
                    </div>

                    {/* AI Insights Panel */}
                    <aside className="w-72 shrink-0 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)] flex items-center gap-2">
                            <Zap size={15} className="text-emerald-400" />
                            <h2 className="text-sm font-semibold text-slate-200">Fleet Insights</h2>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {insights.length === 0 ? (
                                <div className="text-center py-8 text-slate-600 text-sm">
                                    <Zap size={28} className="mx-auto mb-2 opacity-30" />
                                    No insights yet.
                                </div>
                            ) : (
                                insights.map((insight, i) => {
                                    const s = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.info
                                    return (
                                        <div
                                            key={i}
                                            className={`rounded-xl border ${s.border} ${s.bg} px-3.5 py-3 flex gap-2.5`}
                                        >
                                            {s.icon}
                                            <p className={`text-xs leading-relaxed ${s.text}`}>
                                                {insight.message}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </aside>
                </section>
            </div>
        </AppShell>
    )
}

export default DashboardPage
