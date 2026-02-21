import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Search, ChevronDown, Loader2, AlertTriangle, UserCheck, AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { driverService, type DriverPerf, type DriverDutyStatus } from '@/services/driverService'

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' }

function useDebouncedToast() {
    const [toasts, setToasts] = useState<Toast[]>([])
    const counterRef = useRef(0)
    const add = useCallback((message: string, type: Toast['type']) => {
        const id = ++counterRef.current
        setToasts((t) => [...t, { id, message, type }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
    }, []) // stable — never re-created
    return { toasts, add }
}

// ─────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<DriverDutyStatus, string> = {
    ON_DUTY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    OFF_DUTY: 'bg-slate-500/15   text-slate-400   border-slate-500/25',
    SUSPENDED: 'bg-red-500/15     text-red-400     border-red-500/25',
}
const STATUS_LABEL: Record<DriverDutyStatus, string> = {
    ON_DUTY: 'Active', OFF_DUTY: 'Off Duty', SUSPENDED: 'Suspended',
}

const StatusPill: React.FC<{ status: DriverDutyStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
    </span>
)

function safetyColor(score: number) {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
}

// ─────────────────────────────────────────────────────────
// ADD DRIVER FORM
// ─────────────────────────────────────────────────────────
interface AddDriverFormProps {
    saving: boolean
    onSave: (d: { fullName: string; licenseNo: string; licenseExpiry: string; phone: string }) => Promise<void>
    onCancel: () => void
}
const AddDriverForm: React.FC<AddDriverFormProps> = ({ saving, onSave, onCancel }) => {
    const [form, setForm] = useState({ fullName: '', licenseNo: '', licenseExpiry: '', phone: '' })
    const set = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
    const inputCls = `w-full bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,16%)] rounded-lg
        px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600
        focus:outline-none focus:border-blue-500/60 transition-colors`
    const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium'
    return (
        <div className="w-72 shrink-0 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,7%)] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)] flex items-center gap-2">
                <UserCheck size={14} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-200">Add Driver</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.fullName) return; onSave(form) }} className="flex-1 px-5 py-4 space-y-3.5">
                <div>
                    <label className={labelCls}>Full Name *</label>
                    <input value={form.fullName} onChange={set('fullName')} required placeholder="e.g. Rajan Singh" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>License No.</label>
                    <input value={form.licenseNo} onChange={set('licenseNo')} placeholder="e.g. MH-23223" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>License Expiry</label>
                    <input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Phone</label>
                    <input value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={!form.fullName || saving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-blue-500/50 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors disabled:opacity-40">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                        Add Driver
                    </button>
                    <button type="button" onClick={onCancel}
                        className="flex-1 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// PROFILE CARD
// ─────────────────────────────────────────────────────────
const ProfileCard: React.FC<{ driver: DriverPerf }> = ({ driver }) => {
    const score = driver.safetyScore
    const pct = Math.min(100, score)
    const color = safetyColor(score)
    const expiry = driver.licenseExpiry
        ? new Date(driver.licenseExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'

    return (
        <div className="w-64 shrink-0 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,7%)] p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                    {driver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <div className="text-sm font-semibold text-slate-200">{driver.fullName}</div>
                    <StatusPill status={driver.dutyStatus} />
                </div>
            </div>

            {/* Safety Score Meter */}
            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Safety Score</span>
                    <span className={`font-bold ${color}`}>{score}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[hsl(222,40%,12%)]">
                    <div className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }} />
                </div>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-slate-500">License No.</span>
                    <span className="text-slate-300 font-mono">{driver.licenseNo ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Expiry</span>
                    <span className={driver.licenseExpired ? 'text-red-400 font-medium' : 'text-slate-300'}>{expiry}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Trips</span>
                    <span className="text-slate-300">{driver.tripsCompleted}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Late Trips</span>
                    <span className={driver.lateTrips > 0 ? 'text-amber-400' : 'text-slate-300'}>{driver.lateTrips}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Violations</span>
                    <span className={driver.violations > 0 ? 'text-red-400' : 'text-slate-300'}>{driver.violations}</span>
                </div>
                {driver.phone && (
                    <div className="flex justify-between">
                        <span className="text-slate-500">Phone</span>
                        <span className="text-slate-300">{driver.phone}</span>
                    </div>
                )}
            </div>

            {driver.licenseExpired && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    <AlertTriangle size={12} />
                    License Expired — Assignment Blocked
                </div>
            )}
            {driver.safetyScore < 60 && !driver.licenseExpired && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                    <AlertTriangle size={12} />
                    Low Safety Score ({score})
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// SORT OPTIONS
// ─────────────────────────────────────────────────────────
type SortKey = 'Safety Score ↓' | 'Safety Score ↑' | 'Trips ↓' | 'Trips ↑' | 'Name A–Z'

// ─────────────────────────────────────────────────────────
// DRIVERS PAGE
// ─────────────────────────────────────────────────────────
const DriversPage: React.FC = () => {
    const [drivers, setDrivers] = useState<DriverPerf[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<DriverDutyStatus | ''>('')
    const [sortBy, setSortBy] = useState<SortKey>('Safety Score ↓')
    const [showSort, setShowSort] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [selected, setSelected] = useState<DriverPerf | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [addSaving, setAddSaving] = useState(false)
    const [alertDismissed, setAlertDismissed] = useState(false)
    const { toasts, add: addToast } = useDebouncedToast()

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const data = await driverService.getPerformance()
            setDrivers(data)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    // Derived: how many drivers need attention
    const atRiskCount = drivers.filter((d) => d.safetyScore < 60 || d.licenseExpired).length

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const close = () => { setShowSort(false); setShowFilter(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleAddDriver = async (data: { fullName: string; licenseNo: string; licenseExpiry: string; phone: string }) => {
        setAddSaving(true)
        try {
            await driverService.createDriver({
                fullName: data.fullName,
                licenseNo: data.licenseNo || undefined,
                licenseExpiry: data.licenseExpiry || undefined,
                phone: data.phone || undefined,
            })
            addToast('Driver added successfully.', 'success')
            setShowAddForm(false)
            await load()
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setAddSaving(false)
        }
    }

    const SORT_OPTIONS: SortKey[] = ['Safety Score ↓', 'Safety Score ↑', 'Trips ↓', 'Trips ↑', 'Name A–Z']
    const STATUSES: { value: DriverDutyStatus | ''; label: string }[] = [
        { value: '', label: 'All Statuses' },
        { value: 'ON_DUTY', label: 'Active' },
        { value: 'OFF_DUTY', label: 'Off Duty' },
        { value: 'SUSPENDED', label: 'Suspended' },
    ]

    const filtered = drivers
        .filter((d) => {
            const q = search.toLowerCase()
            const matchSearch = !q || d.fullName.toLowerCase().includes(q) || (d.licenseNo ?? '').toLowerCase().includes(q)
            const matchStatus = !filterStatus || d.dutyStatus === filterStatus
            return matchSearch && matchStatus
        })
        .sort((a, b) => {
            if (sortBy === 'Safety Score ↓') return b.safetyScore - a.safetyScore
            if (sortBy === 'Safety Score ↑') return a.safetyScore - b.safetyScore
            if (sortBy === 'Trips ↓') return b.tripsCompleted - a.tripsCompleted
            if (sortBy === 'Trips ↑') return a.tripsCompleted - b.tripsCompleted
            return a.fullName.localeCompare(b.fullName)
        })

    const cols = ['Name', 'License #', 'Expiry', 'Trips', 'Late Trips', 'Violations', 'Safety Score', 'Status']

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-5">

                {/* TOASTS */}
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((t) => (
                        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl
                            ${t.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : t.type === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                    : 'bg-red-500/15 border-red-500/30 text-red-300'}`}>
                            {t.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                                : t.type === 'warning' ? <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                                    : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                            {t.message}
                        </div>
                    ))}
                </div>

                {/* HEADER */}
                <header className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-[380px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" placeholder="Search driver, license..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[hsl(222,40%,8%)] border border-[hsl(217,32%,14%)] rounded-full text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors" />
                    </div>

                    {/* Filter (Status) */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowFilter((v) => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors
                                ${filterStatus ? 'border-blue-500/50 text-blue-400' : 'border-[hsl(217,32%,14%)] text-slate-400 hover:text-slate-200'}`}>
                            Filter {filterStatus ? `· ${STATUS_LABEL[filterStatus]}` : ''} <ChevronDown size={13} />
                        </button>
                        {showFilter && (
                            <div className="absolute top-full left-0 mt-1.5 w-40 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {STATUSES.map((s) => (
                                    <button key={s.value} onClick={() => { setFilterStatus(s.value); setShowFilter(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                                            ${filterStatus === s.value ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowSort((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                            {sortBy} <ChevronDown size={13} />
                        </button>
                        {showSort && (
                            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {SORT_OPTIONS.map((s) => (
                                    <button key={s} onClick={() => { setSortBy(s); setShowSort(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                                            ${sortBy === s ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    <button onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors">
                        <Plus size={15} />
                        Add Driver
                    </button>
                </header>

                {/* AT-RISK BANNER */}
                {!alertDismissed && atRiskCount > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm">
                        <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                        <span className="flex-1">
                            <strong>{atRiskCount} driver{atRiskCount > 1 ? 's' : ''}</strong> need{atRiskCount === 1 ? 's' : ''} attention — low safety score or expired license.
                        </span>
                        <button onClick={() => setAlertDismissed(true)}
                            className="text-amber-500 hover:text-amber-300 text-xs font-medium transition-colors ml-2 shrink-0">
                            Dismiss
                        </button>
                    </div>
                )}

                {/* MAIN */}
                <div className="flex gap-4 flex-1 min-h-0">

                    {showAddForm && (
                        <AddDriverForm saving={addSaving} onSave={handleAddDriver} onCancel={() => setShowAddForm(false)} />
                    )}

                    {/* TABLE */}
                    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">
                                Driver Performance & Safety
                                <span className="ml-2 text-xs text-slate-500 font-normal">{filtered.length} driver{filtered.length !== 1 ? 's' : ''}</span>
                            </h2>
                            {filterStatus && (
                                <button onClick={() => setFilterStatus('')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                    Clear filter
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-blue-500" />
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[hsl(217,32%,14%)]">
                                            {cols.map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-16 text-slate-600 text-sm">
                                                {drivers.length === 0 ? 'No drivers found. Add a driver to get started.' : 'No drivers match the current filters.'}
                                            </td></tr>
                                        ) : filtered.map((d) => (
                                            <tr key={d.id}
                                                onClick={() => setSelected(selected?.id === d.id ? null : d)}
                                                className={`border-b border-[hsl(217,32%,10%)] cursor-pointer transition-colors
                                                    ${selected?.id === d.id ? 'bg-blue-500/8' : 'hover:bg-white/2'}`}>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                                                            {d.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-slate-200 font-medium">{d.fullName}</span>
                                                        {d.licenseExpired && (
                                                            <span title="License expired">
                                                                <AlertTriangle size={12} className="text-red-400" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">{d.licenseNo ?? '—'}</td>
                                                <td className="px-4 py-3.5 text-xs">
                                                    <span className={d.licenseExpired ? 'text-red-400 font-medium' : 'text-slate-400'}>
                                                        {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-300 text-center">{d.tripsCompleted}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={d.lateTrips > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}>{d.lateTrips}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={d.violations > 0 ? 'text-red-400 font-medium' : 'text-slate-500'}>{d.violations}</span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-sm ${safetyColor(d.safetyScore)}`}>{d.safetyScore}</span>
                                                        <div className="flex-1 max-w-[60px] h-1 rounded-full bg-slate-700">
                                                            <div className={`h-full rounded-full ${d.safetyScore >= 80 ? 'bg-emerald-400' : d.safetyScore >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                                style={{ width: `${Math.min(100, d.safetyScore)}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5"><StatusPill status={d.dutyStatus} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* PROFILE CARD */}
                    {selected && <ProfileCard driver={selected} />}

                </div>
            </div>
        </AppShell>
    )
}

export default DriversPage
