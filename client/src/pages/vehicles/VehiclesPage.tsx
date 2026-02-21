import React, { useEffect, useState, useCallback } from 'react'
import {
    Search, ChevronDown, Plus, X, Loader2, AlertCircle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useVehicleStore } from '@/store/vehicleStore'
import type { Vehicle, VehicleStatus } from '@/services/vehicleService'

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const VEHICLE_TYPES = ['Truck', 'Van', 'Mini', 'Tanker', 'Flatbed', 'Pickup', 'Bus']

const STATUS_STYLES: Record<VehicleStatus, string> = {
    AVAILABLE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    ON_TRIP: 'bg-amber-500/15  text-amber-400  border border-amber-500/25',
    IN_SHOP: 'bg-red-500/15    text-red-400    border border-red-500/25',
    RETIRED: 'bg-slate-500/15  text-slate-400  border border-slate-500/25',
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    IN_SHOP: 'In Shop',
    RETIRED: 'Retired',
}

// ─────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: VehicleStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
        {STATUS_LABEL[status]}
    </span>
)

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' }

// ─────────────────────────────────────────────────────────
// NEW VEHICLE MODAL FORM (wireframe: left-side panel)
// ─────────────────────────────────────────────────────────
interface NewVehicleFormProps {
    onSave: (data: {
        plateNumber: string; model: string; type: string
        maxPayload: string; mileage: string; make: string
    }) => Promise<void>
    onCancel: () => void
    saving: boolean
}

const NewVehicleForm: React.FC<NewVehicleFormProps> = ({ onSave, onCancel, saving }) => {
    const [form, setForm] = useState({
        plateNumber: '', make: '', model: '',
        maxPayload: '', mileage: '', type: 'Truck',
    })

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(form)
    }

    const inputCls = `
        w-full bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,18%)] rounded-lg
        px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600
        focus:outline-none focus:border-emerald-500/60 transition-colors
    `
    const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium'

    return (
        <div className="w-72 shrink-0 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,7%)] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)]">
                <h2 className="text-sm font-semibold text-slate-200">New Vehicle Registration</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 px-5 py-4 space-y-3.5">
                {/* License Plate */}
                <div>
                    <label className={labelCls}>License Plate</label>
                    <input
                        value={form.plateNumber}
                        onChange={set('plateNumber')}
                        placeholder="e.g. FF-1099"
                        required
                        className={inputCls}
                    />
                </div>

                {/* Max Payload */}
                <div>
                    <label className={labelCls}>Max Payload (tons)</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={form.maxPayload}
                        onChange={set('maxPayload')}
                        placeholder="e.g. 5"
                        className={inputCls}
                    />
                </div>

                {/* Initial Odometer */}
                <div>
                    <label className={labelCls}>Initial Odometer (km)</label>
                    <input
                        type="number"
                        min="0"
                        value={form.mileage}
                        onChange={set('mileage')}
                        placeholder="e.g. 79000"
                        className={inputCls}
                    />
                </div>

                {/* Type */}
                <div>
                    <label className={labelCls}>Type</label>
                    <select value={form.type} onChange={set('type')} className={inputCls}>
                        {VEHICLE_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Model */}
                <div>
                    <label className={labelCls}>Model</label>
                    <input
                        value={form.model}
                        onChange={set('model')}
                        placeholder="e.g. Volvo FH16"
                        required
                        className={inputCls}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-500/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                        Save
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
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────
const DeleteModal: React.FC<{
    plate: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}> = ({ plate, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-80 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,8%)] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Delete Vehicle</h3>
            <p className="text-sm text-slate-400 mb-5">
                Remove <span className="text-white font-mono">{plate}</span> from the fleet? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Deleting…' : 'Delete'}
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 rounded-lg border border-[hsl(217,32%,20%)] text-slate-400 text-sm font-medium hover:text-slate-200 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)

// ─────────────────────────────────────────────────────────
// VEHICLES PAGE
// ─────────────────────────────────────────────────────────
const VehiclesPage: React.FC = () => {
    const { vehicles, isLoading, fetchVehicles, addVehicle, removeVehicle } = useVehicleStore()

    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [showTypeMenu, setShowTypeMenu] = useState(false)
    const [showStatusMenu, setShowStatusMenu] = useState(false)

    const [toasts, setToasts] = useState<Toast[]>([])
    const [toastId, setToastId] = useState(0)

    const addToast = useCallback((message: string, type: Toast['type']) => {
        const id = toastId + 1
        setToastId(id)
        setToasts((t) => [...t, { id, message, type }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    }, [toastId])

    useEffect(() => { fetchVehicles() }, [fetchVehicles])

    // Close dropdowns on outside click
    useEffect(() => {
        const close = () => { setShowTypeMenu(false); setShowStatusMenu(false) }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleSave = async (data: {
        plateNumber: string; model: string; type: string
        maxPayload: string; mileage: string; make: string
    }) => {
        setSaving(true)
        try {
            await addVehicle({
                plateNumber: data.plateNumber.toUpperCase(),
                model: data.model,
                type: data.type,
                maxPayload: data.maxPayload ? Number(data.maxPayload) : undefined,
                mileage: data.mileage ? Number(data.mileage) : undefined,
            })
            addToast(`Vehicle ${data.plateNumber.toUpperCase()} registered successfully.`, 'success')
            setShowForm(false)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await removeVehicle(deleteTarget.id)
            addToast(`Vehicle ${deleteTarget.plateNumber} removed.`, 'success')
            setDeleteTarget(null)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setDeleting(false)
        }
    }

    // Filtered + sorted vehicles
    const filtered = vehicles.filter((v) => {
        const q = search.toLowerCase()
        const matchesSearch = !q ||
            v.plateNumber.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.make.toLowerCase().includes(q)
        const matchesType = !filterType || v.type === filterType
        const matchesStatus = !filterStatus || v.status === filterStatus
        return matchesSearch && matchesType && matchesStatus
    })

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-6">

                {/* ── TOASTS ─────────────────────────────────────── */}
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl animate-in slide-in-from-right
                                ${t.type === 'success'
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-500/15 border-red-500/30 text-red-300'}`}
                        >
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            {t.message}
                        </div>
                    ))}
                </div>

                {/* ── DELETE MODAL ────────────────────────────────── */}
                {deleteTarget && (
                    <DeleteModal
                        plate={deleteTarget.plateNumber}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteTarget(null)}
                        loading={deleting}
                    />
                )}

                {/* ── TOP HEADER ─────────────────────────────────── */}
                <header className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-[400px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search plate or model..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[hsl(222,40%,8%)] border border-[hsl(217,32%,14%)] rounded-full text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                        />
                    </div>

                    {/* Group By */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                        Group By
                    </button>

                    {/* Filter — Type */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => { setShowTypeMenu((v) => !v); setShowStatusMenu(false) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                            {filterType || 'Filter'}
                            <ChevronDown size={13} />
                        </button>
                        {showTypeMenu && (
                            <div className="absolute top-full left-0 mt-1.5 w-40 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {['', ...VEHICLE_TYPES].map((t) => (
                                    <button key={t} onClick={() => { setFilterType(t); setShowTypeMenu(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterType === t ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {t || 'All Types'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort By — Status */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => { setShowStatusMenu((v) => !v); setShowTypeMenu(false) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                            {filterStatus || 'Sort By'}
                            <ChevronDown size={13} />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {(['', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as const).map((s) => (
                                    <button key={s} onClick={() => { setFilterStatus(s); setShowStatusMenu(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === s ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s ? STATUS_LABEL[s as VehicleStatus] : 'All Statuses'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* New Vehicle button */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} />
                        New Vehicle
                    </button>
                </header>

                {/* ── MAIN CONTENT ───────────────────────────────── */}
                <div className="flex gap-4 flex-1 min-h-0">

                    {/* Left: New Vehicle Form */}
                    {showForm && (
                        <NewVehicleForm
                            onSave={handleSave}
                            onCancel={() => setShowForm(false)}
                            saving={saving}
                        />
                    )}

                    {/* Right: Vehicles Table */}
                    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">
                                Vehicle Registry
                                <span className="ml-2 text-xs text-slate-500 font-normal">
                                    {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}
                                </span>
                            </h2>
                            {(filterType || filterStatus) && (
                                <button
                                    onClick={() => { setFilterType(''); setFilterStatus('') }}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[hsl(217,32%,14%)]">
                                            {['No', 'Plate', 'Model', 'Type', 'Capacity', 'Odometer', 'Status', 'Actions'].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-16 text-slate-600 text-sm">
                                                    {vehicles.length === 0
                                                        ? 'No vehicles registered yet. Click "+ New Vehicle" to add one.'
                                                        : 'No vehicles match current filters.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((v, idx) => (
                                                <tr
                                                    key={v.id}
                                                    className="border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors"
                                                >
                                                    <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">{idx + 1}</td>
                                                    <td className="px-4 py-3.5 text-slate-200 font-mono font-medium">{v.plateNumber}</td>
                                                    <td className="px-4 py-3.5 text-slate-300">
                                                        <div>{v.model}</div>
                                                        {v.make && <div className="text-xs text-slate-500">{v.make}</div>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400">{v.type}</td>
                                                    <td className="px-4 py-3.5 text-slate-400">
                                                        {v.maxPayload != null ? `${v.maxPayload} t` : <span className="text-slate-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                                                        {v.mileage != null ? v.mileage.toLocaleString() : '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <StatusPill status={v.status} />
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <button
                                                            onClick={() => setDeleteTarget(v)}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="Delete vehicle"
                                                        >
                                                            <X size={14} />
                                                        </button>
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

export default VehiclesPage
