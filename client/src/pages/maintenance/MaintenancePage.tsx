import React, { useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Loader2, AlertCircle, Wrench, CheckCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useMaintenanceStore } from '@/store/maintenanceStore'
import type { ServiceLog, ServiceLogStatus } from '@/services/maintenanceService'

// ─────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ServiceLogStatus, string> = {
    NEW: 'bg-slate-500/15  text-slate-300  border border-slate-500/25',
    IN_PROGRESS: 'bg-amber-500/15  text-amber-400  border border-amber-500/25',
    RESOLVED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
}

const STATUS_LABEL: Record<ServiceLogStatus, string> = {
    NEW: 'New',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
}

const StatusPill: React.FC<{ status: ServiceLogStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
        {STATUS_LABEL[status]}
    </span>
)

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' }

// ─────────────────────────────────────────────────────────
// NEW SERVICE MODAL (wireframe: left panel)
// ─────────────────────────────────────────────────────────
interface NewServiceFormProps {
    vehicles: { id: string; plateNumber: string; make: string; model: string; status: string }[]
    vehiclesLoading: boolean
    onCreate: (data: { vehicleId: string; issue: string; serviceDate: string; cost: string }) => Promise<void>
    onCancel: () => void
    saving: boolean
}

const NewServiceForm: React.FC<NewServiceFormProps> = ({
    vehicles, vehiclesLoading, onCreate, onCancel, saving,
}) => {
    const [form, setForm] = useState({
        vehicleId: '',
        issue: '',
        serviceDate: new Date().toISOString().split('T')[0],
        cost: '',
    })

    const setF = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }))

    const isValid = form.vehicleId && form.issue.trim()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return
        onCreate(form)
    }

    const inputCls = `
        w-full bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,16%)] rounded-lg
        px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600
        focus:outline-none focus:border-red-500/60 transition-colors
    `
    const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium'

    return (
        <div className="w-72 shrink-0 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,7%)] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)] flex items-center gap-2">
                <Wrench size={14} className="text-red-400" />
                <h2 className="text-sm font-semibold text-slate-200">New Service</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-4 space-y-3.5">
                {/* Vehicle Name */}
                <div>
                    <label className={labelCls}>Vehicle Name</label>
                    <select
                        value={form.vehicleId}
                        onChange={setF('vehicleId')}
                        required
                        disabled={vehiclesLoading}
                        className={inputCls}
                    >
                        <option value="">— select vehicle —</option>
                        {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.plateNumber} · {v.make || ''} {v.model}
                                {v.status === 'IN_SHOP' ? ' (In Shop)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Issue/Service */}
                <div>
                    <label className={labelCls}>Issue / Service</label>
                    <input
                        value={form.issue}
                        onChange={setF('issue')}
                        placeholder="e.g. Engine Issue, Oil Change"
                        required
                        className={inputCls}
                    />
                </div>

                {/* Date */}
                <div>
                    <label className={labelCls}>Date</label>
                    <input
                        type="date"
                        value={form.serviceDate}
                        onChange={setF('serviceDate')}
                        className={inputCls}
                    />
                </div>

                {/* Cost (optional) */}
                <div>
                    <label className={labelCls}>Cost (optional)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cost}
                        onChange={setF('cost')}
                        placeholder="e.g. 10000"
                        className={inputCls}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={!isValid || saving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-500/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                        Create
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// MAINTENANCE PAGE
// ─────────────────────────────────────────────────────────
const MaintenancePage: React.FC = () => {
    const {
        logs, isLoading, vehicles, vehiclesLoading,
        fetchLogs, fetchVehicles, createLog, resolveLog, removeLog,
    } = useMaintenanceStore()

    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ServiceLog | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [toasts, setToasts] = useState<Toast[]>([])
    const [toastId, setToastId] = useState(0)

    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = toastId + 1
        setToastId(id)
        setToasts((t) => [...t, { id, message, type }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    }, [toastId])

    useEffect(() => {
        fetchLogs()
        fetchVehicles()
    }, [fetchLogs, fetchVehicles])

    useEffect(() => {
        const close = () => setShowStatusMenu(false)
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleCreate = async (data: {
        vehicleId: string; issue: string; serviceDate: string; cost: string
    }) => {
        setSaving(true)
        try {
            await createLog({
                vehicleId: data.vehicleId,
                issue: data.issue,
                serviceDate: data.serviceDate || undefined,
                cost: data.cost ? Number(data.cost) : undefined,
            })
            // Refresh vehicles list (status may have changed to IN_SHOP)
            await fetchVehicles()
            addToast('Service log created. Vehicle marked as In Shop.', 'success')
            setShowForm(false)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleResolve = async (id: string) => {
        try {
            await resolveLog(id)
            await fetchVehicles()
            addToast('Issue resolved. Vehicle is now Available.', 'success')
        } catch (err) {
            addToast((err as Error).message, 'error')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await removeLog(deleteTarget.id)
            addToast('Service log removed.', 'success')
            setDeleteTarget(null)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setDeleting(false)
        }
    }

    // Filtered logs
    const filtered = logs.filter((l) => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
            l.vehicle?.plateNumber?.toLowerCase().includes(q) ||
            l.vehicle?.model?.toLowerCase().includes(q) ||
            l.vehicle?.make?.toLowerCase().includes(q) ||
            l.issue.toLowerCase().includes(q)
        const matchStatus = !filterStatus || l.status === filterStatus
        return matchSearch && matchStatus
    })

    const formattedDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    const ALL_STATUSES: { value: ServiceLogStatus | ''; label: string }[] = [
        { value: '', label: 'All Statuses' },
        { value: 'NEW', label: 'New' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'RESOLVED', label: 'Resolved' },
    ]

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-5">

                {/* ── TOASTS ─────────────────────────────────── */}
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((t) => (
                        <div key={t.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl
                                ${t.type === 'success'
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-500/15 border-red-500/30 text-red-300'}`}
                        >
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            {t.message}
                        </div>
                    ))}
                </div>

                {/* ── DELETE CONFIRM ──────────────────────────── */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-80 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,8%)] p-6 shadow-2xl">
                            <h3 className="text-sm font-semibold text-slate-200 mb-2">Delete Service Log</h3>
                            <p className="text-sm text-slate-400 mb-5">
                                Remove log{' '}
                                <span className="text-white font-mono">#{deleteTarget.logNumber}</span>{' '}
                                for <span className="text-white">{deleteTarget.vehicle?.plateNumber ?? '—'}</span>?
                            </p>
                            <div className="flex gap-3">
                                <button onClick={handleDelete} disabled={deleting}
                                    className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50">
                                    {deleting ? 'Deleting…' : 'Delete'}
                                </button>
                                <button onClick={() => setDeleteTarget(null)}
                                    className="flex-1 py-2 rounded-lg border border-[hsl(217,32%,20%)] text-slate-400 text-sm font-medium hover:text-slate-200 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── HEADER ─────────────────────────────────── */}
                <header className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-[400px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search plate, model, issue..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[hsl(222,40%,8%)] border border-[hsl(217,32%,14%)] rounded-full text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                        />
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 transition-colors">
                        Group By
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 transition-colors">
                        Filter
                    </button>

                    {/* Sort by status */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowStatusMenu((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                            {filterStatus ? STATUS_LABEL[filterStatus as ServiceLogStatus] : 'Sort By'}
                            <ChevronDown size={13} />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {ALL_STATUSES.map((s) => (
                                    <button key={s.value}
                                        onClick={() => { setFilterStatus(s.value); setShowStatusMenu(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                                            ${filterStatus === s.value ? 'text-red-400 bg-red-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* + Create New Service */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} />
                        Create New Service
                    </button>
                </header>

                {/* ── MAIN CONTENT ───────────────────────────── */}
                <div className="flex gap-4 flex-1 min-h-0">

                    {/* Left: New Service Form (wireframe panel) */}
                    {showForm && (
                        <NewServiceForm
                            vehicles={vehicles}
                            vehiclesLoading={vehiclesLoading}
                            onCreate={handleCreate}
                            onCancel={() => setShowForm(false)}
                            saving={saving}
                        />
                    )}

                    {/* Right: Service Logs Table */}
                    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">
                                Maintenance &amp; Service Logs
                                <span className="ml-2 text-xs text-slate-500 font-normal">
                                    {filtered.length} log{filtered.length !== 1 ? 's' : ''}
                                </span>
                            </h2>
                            {filterStatus && (
                                <button onClick={() => setFilterStatus('')}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                    Clear filter
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-red-500" />
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[hsl(217,32%,14%)]">
                                            {['Log ID', 'Vehicle', 'Issue / Service', 'Date', 'Cost', 'Status', 'Actions'].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-16 text-slate-600 text-sm">
                                                    {logs.length === 0
                                                        ? 'No service logs yet. Click "+ Create New Service" to log an issue.'
                                                        : 'No logs match current filters.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((log) => (
                                                <tr key={log.id}
                                                    className="border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors">
                                                    <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">
                                                        #{log.logNumber}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="text-slate-200 font-mono font-medium">
                                                            {log.vehicle?.plateNumber ?? <span className="text-slate-600 italic">No vehicle</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {log.vehicle
                                                                ? `${log.vehicle.make ? log.vehicle.make + ' ' : ''}${log.vehicle.model} · ${log.vehicle.type}`
                                                                : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-300 max-w-[200px]">
                                                        {log.issue}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                                                        {formattedDate(log.serviceDate)}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                                                        {log.cost != null
                                                            ? `₹${log.cost.toLocaleString()}`
                                                            : <span className="text-slate-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <StatusPill status={log.status} />
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1">
                                                            {log.status !== 'RESOLVED' && (
                                                                <button
                                                                    onClick={() => handleResolve(log.id)}
                                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                                    title="Mark as Resolved"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setDeleteTarget(log)}
                                                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                                title="Delete log"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}

export default MaintenancePage
