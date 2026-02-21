import React, { useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown, Plus, X, Loader2, AlertCircle, Truck } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useTripStore } from '@/store/tripStore'
import type { Trip, TripStatus, AvailableVehicle } from '@/services/tripService'

// ─────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<TripStatus, string> = {
    DRAFT: 'bg-slate-500/15  text-slate-400  border border-slate-500/25',
    DISPATCHED: 'bg-blue-500/15   text-blue-400   border border-blue-500/25',
    IN_TRANSIT: 'bg-amber-500/15  text-amber-400  border border-amber-500/25',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    CANCELLED: 'bg-red-500/15    text-red-400    border border-red-500/25',
}

const STATUS_LABEL: Record<TripStatus, string> = {
    DRAFT: 'Scheduled',
    DISPATCHED: 'Dispatched',
    IN_TRANSIT: 'On Route',
    COMPLETED: 'Delivered',
    CANCELLED: 'Cancelled',
}

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: TripStatus }> = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
        {STATUS_LABEL[status]}
    </span>
)

interface Toast { id: number; message: string; type: 'success' | 'error' }

// ─────────────────────────────────────────────────────────
// DISPATCH FORM (wireframe: bottom-left panel)
// ─────────────────────────────────────────────────────────
interface DispatchFormProps {
    vehicles: AvailableVehicle[]
    drivers: { id: string; fullName: string }[]
    resourcesLoading: boolean
    onDispatch: (data: {
        vehicleId: string; driverId: string; origin: string
        destination: string; cargoWeight: string; estimatedFuelCost: string
    }) => Promise<void>
    dispatching: boolean
}

const DispatchForm: React.FC<DispatchFormProps> = ({
    vehicles, drivers, resourcesLoading, onDispatch, dispatching,
}) => {
    const [form, setForm] = useState({
        vehicleId: '', driverId: '', origin: '',
        destination: '', cargoWeight: '', estimatedFuelCost: '',
    })

    const setF = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }))

    // Payload warning: check selected vehicle capacity vs cargo
    const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId)
    const cargoKg = parseFloat(form.cargoWeight) || 0
    const payloadTons = selectedVehicle?.maxPayload ?? null
    const isOverweight = payloadTons !== null && cargoKg / 1000 > payloadTons
    const isValid = form.origin.trim() && form.destination.trim() && !isOverweight

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return
        onDispatch(form)
    }

    const inputCls = `
        w-full bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,16%)] rounded-lg
        px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600
        focus:outline-none focus:border-blue-500/60 transition-colors
    `
    const labelCls = 'block text-xs text-slate-400 mb-1 font-medium'

    return (
        <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,7%)] overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-[hsl(217,32%,14%)]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">New Trip Form</span>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {/* Select Vehicle */}
                    <div>
                        <label className={labelCls}>Select Vehicle</label>
                        <select value={form.vehicleId} onChange={setF('vehicleId')} className={inputCls} disabled={resourcesLoading}>
                            <option value="">— pick vehicle —</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.plateNumber} · {v.type}{v.maxPayload ? ` · ${v.maxPayload}t` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cargo Weight */}
                    <div>
                        <label className={labelCls}>Cargo Weight (kg)</label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={form.cargoWeight}
                            onChange={setF('cargoWeight')}
                            placeholder="e.g. 3500"
                            className={`${inputCls} ${isOverweight ? 'border-red-500/60' : ''}`}
                        />
                        {isOverweight && (
                            <p className="text-xs text-red-400 mt-1">
                                Too heavy! Max: {(payloadTons! * 1000).toFixed(0)} kg
                            </p>
                        )}
                    </div>

                    {/* Select Driver */}
                    <div>
                        <label className={labelCls}>Select Driver</label>
                        <select value={form.driverId} onChange={setF('driverId')} className={inputCls} disabled={resourcesLoading}>
                            <option value="">— pick driver —</option>
                            {drivers.map((d) => (
                                <option key={d.id} value={d.id}>{d.fullName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estimated Fuel Cost */}
                    <div>
                        <label className={labelCls}>Estimated Fuel Cost</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.estimatedFuelCost}
                            onChange={setF('estimatedFuelCost')}
                            placeholder="e.g. 4500"
                            className={inputCls}
                        />
                    </div>

                    {/* Origin */}
                    <div>
                        <label className={labelCls}>Origin Address</label>
                        <input
                            value={form.origin}
                            onChange={setF('origin')}
                            placeholder="e.g. Mumbai"
                            required
                            className={inputCls}
                        />
                    </div>

                    {/* Destination */}
                    <div>
                        <label className={labelCls}>Destination</label>
                        <input
                            value={form.destination}
                            onChange={setF('destination')}
                            placeholder="e.g. Pune"
                            required
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Confirm & Dispatch */}
                <button
                    type="submit"
                    disabled={!isValid || dispatching}
                    className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 rounded-xl border border-blue-500/50 bg-blue-500/10 text-blue-300 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {dispatching ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    Confirm & Dispatch Trip
                </button>
            </form>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// TRIPS PAGE
// ─────────────────────────────────────────────────────────
const TripsPage: React.FC = () => {
    const {
        trips, isLoading, availableVehicles, availableDrivers, resourcesLoading,
        fetchTrips, fetchResources, dispatchTrip, removeTrip,
    } = useTripStore()

    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [showStatusMenu, setShowStatusMenu] = useState(false)
    const [dispatching, setDispatching] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)
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
        fetchTrips()
        fetchResources()
    }, [fetchTrips, fetchResources])

    // Close dropdowns
    useEffect(() => {
        const close = () => setShowStatusMenu(false)
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleDispatch = async (data: {
        vehicleId: string; driverId: string; origin: string
        destination: string; cargoWeight: string; estimatedFuelCost: string
    }) => {
        setDispatching(true)
        try {
            await dispatchTrip({
                vehicleId: data.vehicleId || undefined,
                driverId: data.driverId || undefined,
                origin: data.origin,
                destination: data.destination,
                cargoWeight: data.cargoWeight ? Number(data.cargoWeight) : undefined,
                estimatedFuelCost: data.estimatedFuelCost ? Number(data.estimatedFuelCost) : undefined,
            })
            // Refresh available vehicles after dispatch
            await fetchResources()
            addToast(`Trip dispatched: ${data.origin} → ${data.destination}`, 'success')
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setDispatching(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await removeTrip(deleteTarget.id)
            await fetchResources()
            addToast('Trip removed.', 'success')
            setDeleteTarget(null)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setDeleting(false)
        }
    }

    // Filter
    const filtered = trips.filter((t) => {
        const q = search.toLowerCase()
        const matchSearch = !q ||
            t.origin.toLowerCase().includes(q) ||
            t.destination.toLowerCase().includes(q) ||
            t.vehicle?.plateNumber.toLowerCase().includes(q) ||
            t.vehicle?.type.toLowerCase().includes(q)
        const matchStatus = !filterStatus || t.status === filterStatus
        return matchSearch && matchStatus
    })

    const ALL_STATUSES: { value: TripStatus | ''; label: string }[] = [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Scheduled' },
        { value: 'DISPATCHED', label: 'Dispatched' },
        { value: 'IN_TRANSIT', label: 'On Route' },
        { value: 'COMPLETED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
    ]

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-5">

                {/* ── TOASTS ─────────────────────────────────── */}
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
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
                            <h3 className="text-sm font-semibold text-slate-200 mb-2">Delete Trip</h3>
                            <p className="text-sm text-slate-400 mb-5">
                                Remove trip{' '}
                                <span className="text-white font-mono">#{deleteTarget.tripNumber}</span>{' '}
                                ({deleteTarget.origin} → {deleteTarget.destination})?
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
                    <div className="relative flex-1 min-w-[200px] max-w-[960px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by origin, destination, plate..."
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

                    {/* Status sort */}
                    <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowStatusMenu((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                            {filterStatus ? STATUS_LABEL[filterStatus as TripStatus] : 'Sort By'}
                            <ChevronDown size={13} />
                        </button>
                        {showStatusMenu && (
                            <div className="absolute top-full left-0 mt-1.5 w-36 rounded-xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,9%)] shadow-xl z-50 overflow-hidden">
                                {ALL_STATUSES.map((s) => (
                                    <button key={s.value} onClick={() => { setFilterStatus(s.value); setShowStatusMenu(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${filterStatus === s.value ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={() => document.getElementById('new-trip-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} />
                        New Trip
                    </button>
                </header>

                {/* ── TRIPS TABLE ─────────────────────────────── */}
                <div className="rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-200">
                            Trip Dispatcher
                            <span className="ml-2 text-xs text-slate-500 font-normal">
                                {filtered.length} trip{filtered.length !== 1 ? 's' : ''}
                            </span>
                        </h2>
                        {filterStatus && (
                            <button onClick={() => setFilterStatus('')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                Clear filter
                            </button>
                        )}
                    </div>

                    <div className="overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-14">
                                <Loader2 size={22} className="animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[hsl(217,32%,14%)]">
                                        {['No', 'Trip Fleet Type', 'Origin', 'Destination', 'Status', 'Cargo', 'Fuel Est.', 'Actions'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-14 text-slate-600 text-sm">
                                                {trips.length === 0
                                                    ? 'No trips dispatched yet. Use the form below to create your first trip.'
                                                    : 'No trips match current filters.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((t, idx) => (
                                            <tr key={t.id} className="border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors">
                                                <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">{idx + 1}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="text-slate-200 font-medium">
                                                        {t.vehicle
                                                            ? `${t.vehicle.make || ''} ${t.vehicle.model}`.trim()
                                                            : <span className="text-slate-600 italic">No vehicle</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        {t.vehicle?.plateNumber ?? ''}{t.vehicle?.type ? ` · ${t.vehicle.type}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-amber-300">{t.origin}</td>
                                                <td className="px-4 py-3.5 text-amber-300">{t.destination}</td>
                                                <td className="px-4 py-3.5">
                                                    <StatusPill status={t.status} />
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-400 text-xs">
                                                    {t.cargoWeight != null ? `${t.cargoWeight.toLocaleString()} kg` : <span className="text-slate-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-400 text-xs">
                                                    {t.estimatedFuelCost != null ? `₹${t.estimatedFuelCost.toLocaleString()}` : <span className="text-slate-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <button
                                                        onClick={() => setDeleteTarget(t)}
                                                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete trip"
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

                {/* ── DISPATCH FORM (wireframe: bottom-left panel) ── */}
                <div id="new-trip-form">
                    <DispatchForm
                        vehicles={availableVehicles}
                        drivers={availableDrivers}
                        resourcesLoading={resourcesLoading}
                        onDispatch={handleDispatch}
                        dispatching={dispatching}
                    />
                </div>
            </div>
        </AppShell>
    )
}

export default TripsPage
