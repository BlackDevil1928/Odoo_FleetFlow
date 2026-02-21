import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronDown, Loader2, X, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { expenseService, type Expense, type TripOption } from '@/services/expenseService'
import { useDashboardStore } from '@/store/dashboardStore'

// ─────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' }

function useDebouncedToast() {
    const [toasts, setToasts] = useState<Toast[]>([])
    const [tid, setTid] = useState(0)
    const add = useCallback((message: string, type: Toast['type']) => {
        const id = tid + 1
        setTid(id)
        setToasts((t) => [...t, { id, message, type }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    }, [tid])
    return { toasts, add }
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const INR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

interface RowMeta { isHighCost: boolean; isEfficient: boolean }
function rowMeta(e: Expense): RowMeta {
    return {
        isHighCost: e.totalCost > 50_000,
        isEfficient: e.fuelLiters != null && e.fuelLiters > 0 && (e.fuelCost / e.fuelLiters) < 90,
    }
}

// ─────────────────────────────────────────────────────────
// NEW EXPENSE FORM
// ─────────────────────────────────────────────────────────
interface FormProps {
    trips: TripOption[]
    tripsLoading: boolean
    saving: boolean
    onCreate: (data: {
        tripId: string; fuelLiters: string; fuelCost: string; miscExpense: string;
    }) => Promise<void>
    onCancel: () => void
}

const NewExpenseForm: React.FC<FormProps> = ({ trips, tripsLoading, saving, onCreate, onCancel }) => {
    const [form, setForm] = useState({ tripId: '', fuelLiters: '', fuelCost: '', miscExpense: '' })
    const set = (k: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm((f) => ({ ...f, [k]: e.target.value }))

    const fc = Number(form.fuelCost || 0)
    const mc = Number(form.miscExpense || 0)
    const total = fc + mc

    const inputCls = `w-full bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,16%)] rounded-lg
        px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600
        focus:outline-none focus:border-amber-500/60 transition-colors`
    const labelCls = 'block text-xs text-slate-400 mb-1.5 font-medium'

    return (
        <div className="w-72 shrink-0 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,7%)] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[hsl(217,32%,14%)] flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-200">New Expense</h2>
            </div>
            <form
                onSubmit={(e) => { e.preventDefault(); if (!form.tripId || !form.fuelCost) return; onCreate(form) }}
                className="flex-1 px-5 py-4 space-y-3.5"
            >
                {/* Trip ID */}
                <div>
                    <label className={labelCls}>Trip ID</label>
                    <select value={form.tripId} onChange={set('tripId')} required disabled={tripsLoading} className={inputCls}>
                        <option value="">— select completed trip —</option>
                        {trips.map((t) => (
                            <option key={t.id} value={t.id}>
                                #{t.tripNumber} · {t.origin} → {t.destination}
                            </option>
                        ))}
                    </select>
                    {trips.length === 0 && !tripsLoading && (
                        <p className="text-xs text-slate-600 mt-1">No unlogged completed trips.</p>
                    )}
                </div>

                {/* Driver (auto-filled hint) */}
                {form.tripId && (() => {
                    const t = trips.find((x) => x.id === form.tripId)
                    return t?.driver ? (
                        <div>
                            <label className={labelCls}>Driver</label>
                            <div className="text-sm text-slate-400 bg-[hsl(222,40%,6%)] border border-[hsl(217,32%,16%)] rounded-lg px-3 py-2">
                                {t.driver.fullName}
                            </div>
                        </div>
                    ) : null
                })()}

                {/* Fuel Liters */}
                <div>
                    <label className={labelCls}>Fuel (Liters)</label>
                    <input type="number" min="0" step="0.1" value={form.fuelLiters} onChange={set('fuelLiters')}
                        placeholder="e.g. 120" className={inputCls} />
                </div>

                {/* Fuel Cost */}
                <div>
                    <label className={labelCls}>Fuel Cost (₹) *</label>
                    <input type="number" min="0" step="0.01" value={form.fuelCost} onChange={set('fuelCost')}
                        required placeholder="e.g. 12000" className={inputCls} />
                </div>

                {/* Misc Expense */}
                <div>
                    <label className={labelCls}>Misc. Expense (₹)</label>
                    <input type="number" min="0" step="0.01" value={form.miscExpense} onChange={set('miscExpense')}
                        placeholder="e.g. 3000" className={inputCls} />
                </div>

                {/* Auto Total */}
                {total > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                        <span className="text-xs text-slate-400">Total Cost</span>
                        <span className="text-amber-400 font-semibold text-sm">{INR(total)}</span>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={!form.tripId || !form.fuelCost || saving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-emerald-500/50 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors disabled:opacity-40">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                        Create
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
// EXPENSES PAGE
// ─────────────────────────────────────────────────────────
const SORT_OPTIONS = ['Date (Newest)', 'Date (Oldest)', 'Total Cost ↑', 'Total Cost ↓']

const ExpensesPage: React.FC = () => {
    const { fetchDashboard } = useDashboardStore()

    const [expenses, setExpenses] = useState<Expense[]>([])
    const [trips, setTrips] = useState<TripOption[]>([])
    const [loading, setLoading] = useState(true)
    const [tripsLoading, setTripsLoading] = useState(false)

    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('Date (Newest)')
    const [showSort, setShowSort] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
    const [deleting, setDeleting] = useState(false)

    const { toasts, add: addToast } = useDebouncedToast()

    const loadExpenses = useCallback(async () => {
        try {
            setLoading(true)
            const data = await expenseService.getAll()
            setExpenses(data)
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addToast])

    const loadTrips = useCallback(async () => {
        setTripsLoading(true)
        try {
            const data = await expenseService.getCompletedTrips()
            setTrips(data)
        } catch {
            // silent
        } finally {
            setTripsLoading(false)
        }
    }, [])

    useEffect(() => { loadExpenses(); loadTrips() }, [loadExpenses, loadTrips])
    useEffect(() => {
        const close = () => setShowSort(false)
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const handleCreate = async (data: { tripId: string; fuelLiters: string; fuelCost: string; miscExpense: string }) => {
        const trip = trips.find((t) => t.id === data.tripId)
        setSaving(true)
        try {
            await expenseService.create({
                tripId: data.tripId,
                driverId: trip?.driver?.id,
                vehicleId: trip?.vehicle?.id,
                fuelLiters: data.fuelLiters ? Number(data.fuelLiters) : undefined,
                fuelCost: Number(data.fuelCost),
                miscExpense: Number(data.miscExpense || 0),
            })
            addToast('Expense logged successfully.', 'success')
            setShowForm(false)
            await Promise.all([loadExpenses(), loadTrips(), fetchDashboard()])
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
            await expenseService.delete(deleteTarget.id)
            addToast('Expense removed.', 'success')
            setDeleteTarget(null)
            await Promise.all([loadExpenses(), loadTrips()])
        } catch (err) {
            addToast((err as Error).message, 'error')
        } finally {
            setDeleting(false)
        }
    }

    // Filter + sort
    const filtered = expenses
        .filter((e) => {
            const q = search.toLowerCase()
            return !q ||
                `#${e.trip.tripNumber}`.includes(q) ||
                e.driver?.fullName.toLowerCase().includes(q) ||
                e.vehicle?.plateNumber.toLowerCase().includes(q) ||
                e.trip.origin.toLowerCase().includes(q)
        })
        .sort((a, b) => {
            if (sortBy === 'Date (Newest)') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            if (sortBy === 'Date (Oldest)') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            if (sortBy === 'Total Cost ↑') return a.totalCost - b.totalCost
            return b.totalCost - a.totalCost
        })

    const cols = ['Trip ID', 'Vehicle', 'Driver', 'Fuel (L)', 'Fuel Cost', 'Misc. Expense', 'Total Op. Cost', 'Date']

    return (
        <AppShell>
            <div className="min-h-screen p-6 flex flex-col gap-5">

                {/* TOASTS */}
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((t) => (
                        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl
                            ${t.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'}`}>
                            {t.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                            {t.message}
                        </div>
                    ))}
                </div>

                {/* DELETE CONFIRM */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-80 rounded-2xl border border-[hsl(217,32%,16%)] bg-[hsl(222,40%,8%)] p-6 shadow-2xl">
                            <h3 className="text-sm font-semibold text-slate-200 mb-2">Delete Expense</h3>
                            <p className="text-sm text-slate-400 mb-5">
                                Remove expense for trip{' '}
                                <span className="text-white font-mono">#{deleteTarget.trip.tripNumber}</span>?
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

                {/* HEADER */}
                <header className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px] max-w-[380px]">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" placeholder="Search trip, driver, plate..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-[hsl(222,40%,8%)] border border-[hsl(217,32%,14%)] rounded-full text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors" />
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 transition-colors">
                        Group By
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(217,32%,14%)] text-sm text-slate-400 hover:text-slate-200 transition-colors">
                        Filter
                    </button>

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
                                            ${sortBy === s ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    <button onClick={() => { setShowForm(true); loadTrips() }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors">
                        <Plus size={15} />
                        Add an Expense
                    </button>
                </header>

                {/* MAIN */}
                <div className="flex gap-4 flex-1 min-h-0">
                    {showForm && (
                        <NewExpenseForm
                            trips={trips}
                            tripsLoading={tripsLoading}
                            saving={saving}
                            onCreate={handleCreate}
                            onCancel={() => setShowForm(false)}
                        />
                    )}

                    <div className="flex-1 rounded-2xl border border-[hsl(217,32%,14%)] bg-[hsl(222,40%,8%)] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-200">
                                Trip & Expense Log
                                <span className="ml-2 text-xs text-slate-500 font-normal">
                                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                                </span>
                            </h2>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500/80 inline-block" /> High Cost</span>
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" /> Efficient</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 size={24} className="animate-spin text-amber-500" />
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[hsl(217,32%,14%)]">
                                            {cols.map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={9} className="text-center py-16 text-slate-600 text-sm">
                                                {expenses.length === 0
                                                    ? 'No expenses logged yet. Click "+ Add an Expense" to start.'
                                                    : 'No records match the current search.'}
                                            </td></tr>
                                        ) : filtered.map((exp) => {
                                            const { isHighCost, isEfficient } = rowMeta(exp)
                                            const rowCls = isHighCost
                                                ? 'border-b border-[hsl(217,32%,10%)] bg-red-500/5 hover:bg-red-500/8 transition-colors'
                                                : isEfficient
                                                    ? 'border-b border-[hsl(217,32%,10%)] bg-emerald-500/5 hover:bg-emerald-500/8 transition-colors'
                                                    : 'border-b border-[hsl(217,32%,10%)] hover:bg-white/2 transition-colors'
                                            return (
                                                <tr key={exp.id} className={rowCls}>
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">#{exp.trip.tripNumber}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="text-slate-200 font-mono font-medium text-xs">
                                                            {exp.vehicle?.plateNumber ?? <span className="text-slate-600 italic">—</span>}
                                                        </div>
                                                        <div className="text-xs text-slate-600">
                                                            {exp.vehicle ? `${exp.vehicle.make} ${exp.vehicle.model}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-300 text-sm">
                                                        {exp.driver?.fullName ?? <span className="text-slate-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs">
                                                        {exp.fuelLiters != null ? `${exp.fuelLiters}L` : <span className="text-slate-600">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-300 text-xs font-medium">{INR(exp.fuelCost)}</td>
                                                    <td className="px-4 py-3.5 text-slate-400 text-xs">{INR(exp.miscExpense)}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`font-semibold text-sm ${isHighCost ? 'text-red-400' : isEfficient ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                            {INR(exp.totalCost)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                                                        {new Date(exp.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <button onClick={() => setDeleteTarget(exp)}
                                                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="Delete expense">
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
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

export default ExpensesPage
