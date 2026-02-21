import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, Wifi, WifiOff, Loader2, Truck, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { trackingService, type VehiclePosition } from '@/services/trackingService'

// ─────────────────────────────────────────────────────────
// FIX LEAFLET DEFAULT ICON (Vite build issue)
// ─────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─────────────────────────────────────────────────────────
// CUSTOM TRUCK SVG ICONS
// ─────────────────────────────────────────────────────────
function makeTruckIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: '',
        html: `
            <div style="
                position:relative;
                width:36px; height:36px;
            ">
                <div style="
                    position:absolute; inset:0;
                    background:${color};
                    border-radius:50%;
                    opacity:0.25;
                    animation:pulse-ring 2s ease-out infinite;
                "></div>
                <div style="
                    position:absolute; top:50%; left:50%;
                    transform:translate(-50%,-50%);
                    width:24px; height:24px;
                    background:${color};
                    border-radius:50%;
                    border:2px solid white;
                    display:flex; align-items:center; justify-content:center;
                ">
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='white' xmlns='http://www.w3.org/2000/svg'>
                        <path d='M18 18.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11m14.5.5H9m-3 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0M3 17.5V7'
                        stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
    })
}

const ICONS = {
    IN_TRANSIT: makeTruckIcon('#10b981'),
    DISPATCHED: makeTruckIcon('#f59e0b'),
    DEFAULT: makeTruckIcon('#64748b'),
}

function getIcon(status: string) {
    return ICONS[status as keyof typeof ICONS] ?? ICONS.DEFAULT
}

// ─────────────────────────────────────────────────────────
// MAP PAN CONTROLLER — pans map when user clicks a trip card
// ─────────────────────────────────────────────────────────
interface PanToProps { target: VehiclePosition | null }
const PanTo: React.FC<PanToProps> = ({ target }) => {
    const map = useMap()
    useEffect(() => {
        if (target) map.flyTo([target.lat, target.lng], 8, { duration: 1.2 })
    }, [target, map])
    return null
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function fmtEta(minutes: number): string {
    if (minutes <= 0) return 'Arriving'
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─────────────────────────────────────────────────────────
// TRIP CARD
// ─────────────────────────────────────────────────────────
interface TripCardProps { v: VehiclePosition; selected: boolean; onClick: () => void }
const TripCard: React.FC<TripCardProps> = ({ v, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selected
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-[hsl(217,32%,16%)] bg-[hsl(222,40%,9%)] hover:border-slate-500/40 hover:bg-[hsl(222,40%,10%)]'
            }`}
    >
        <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">#{v.tripNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${v.status === 'IN_TRANSIT'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                }`}>
                {v.status === 'IN_TRANSIT' ? 'In Transit' : 'Dispatched'}
            </span>
        </div>

        {/* Route */}
        <div className="flex items-center gap-1.5 mb-3 min-w-0">
            <span className="text-xs text-slate-300 truncate font-medium">{v.origin}</span>
            <ArrowRight size={10} className="text-slate-600 shrink-0" />
            <span className="text-xs text-slate-300 truncate font-medium">{v.destination}</span>
        </div>

        {/* Driver & Vehicle */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
            {v.driver && (
                <span className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] text-slate-300 font-bold shrink-0">
                        {v.driver.fullName.charAt(0)}
                    </div>
                    {v.driver.fullName}
                </span>
            )}
            {v.vehicle && (
                <span className="flex items-center gap-1">
                    <Truck size={10} className="shrink-0" />
                    {v.vehicle.plateNumber}
                </span>
            )}
        </div>

        {/* Progress bar */}
        <div className="mb-1.5">
            <div className="w-full h-1.5 rounded-full bg-[hsl(222,40%,14%)]">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${v.status === 'IN_TRANSIT' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                    style={{ width: `${v.progressPct}%` }}
                />
            </div>
        </div>
        <div className="flex justify-between text-xs text-slate-600">
            <span>{v.progressPct}% · {v.distanceKm} km</span>
            <span className="flex items-center gap-1">
                <Clock size={10} />
                {fmtEta(v.etaMinutes)}
            </span>
        </div>
    </div>
)

// ─────────────────────────────────────────────────────────
// FLEET TRACKING PAGE
// ─────────────────────────────────────────────────────────
const FleetTrackingPage: React.FC = () => {
    const [positions, setPositions] = useState<VehiclePosition[]>([])
    const [loading, setLoading] = useState(true)
    const [connected, setConnected] = useState(false)
    const [panTarget, setPanTarget] = useState<VehiclePosition | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const socketRef = useRef<ReturnType<typeof trackingService.createSocket> | null>(null)

    // HTTP snapshot on mount (before socket connects)
    const loadSnapshot = useCallback(async () => {
        try {
            const data = await trackingService.getSnapshot()
            setPositions(data)
            setLastUpdate(new Date())
        } catch {
            // socket will compensate
        } finally {
            setLoading(false)
        }
    }, [])

    // Socket.io connection
    useEffect(() => {
        loadSnapshot()

        const socket = trackingService.createSocket()
        socketRef.current = socket

        socket.on('connect', () => setConnected(true))
        socket.on('disconnect', () => setConnected(false))
        socket.on('fleet:positions', (data: VehiclePosition[]) => {
            setPositions(data)
            setLastUpdate(new Date())
        })

        return () => { socket.disconnect() }
    }, [loadSnapshot])

    const handleCardClick = (v: VehiclePosition) => {
        setSelectedId(v.tripId)
        setPanTarget(v)
    }

    const activeCount = positions.filter((p) => p.status === 'IN_TRANSIT').length

    return (
        <AppShell>
            {/* Pulse animation */}
            <style>{`
                @keyframes pulse-ring {
                    0%   { transform: scale(0.8); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
            `}</style>

            <div className="h-screen flex flex-col overflow-hidden">
                {/* TOP BAR */}
                <div className="shrink-0 px-5 py-3 border-b border-[hsl(217,32%,14%)] bg-[hsl(222,40%,7%)] flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Navigation size={16} className="text-blue-400" />
                        <span className="text-sm font-semibold text-slate-200">Live Fleet Tracking</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
                            {connected ? 'Live' : 'Connecting…'}
                        </span>
                    </div>

                    {lastUpdate && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                            <RefreshCw size={10} />
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}

                    <div className="flex-1" />

                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            {activeCount} In Transit
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-400">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            {positions.filter((p) => p.status === 'DISPATCHED').length} Dispatched
                        </span>
                        <span className="text-slate-500">
                            {positions.length} Total Active
                        </span>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 flex min-h-0">

                    {/* MAP */}
                    <div className="flex-1 relative">
                        {loading && (
                            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[hsl(222,40%,7%)]">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 size={28} className="animate-spin text-blue-400" />
                                    <span className="text-sm text-slate-500">Loading fleet positions…</span>
                                </div>
                            </div>
                        )}
                        <MapContainer
                            center={[20.5937, 78.9629]}
                            zoom={5}
                            style={{ height: '100%', width: '100%', background: 'hsl(222,40%,7%)' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <PanTo target={panTarget} />

                            {positions.map((v) => (
                                <Marker
                                    key={v.tripId}
                                    position={[v.lat, v.lng]}
                                    icon={getIcon(v.status)}
                                    eventHandlers={{ click: () => handleCardClick(v) }}
                                >
                                    <Popup className="fleet-popup" maxWidth={280}>
                                        <div className="bg-[hsl(222,40%,8%)] text-slate-200 rounded-lg p-3 text-xs space-y-2 min-w-[220px]">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-blue-400">
                                                    Trip #{v.tripNumber}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${v.status === 'IN_TRANSIT'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {v.status === 'IN_TRANSIT' ? 'In Transit' : 'Dispatched'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 text-slate-300">
                                                <span className="truncate">{v.origin}</span>
                                                <ArrowRight size={10} className="shrink-0 text-slate-600" />
                                                <span className="truncate">{v.destination}</span>
                                            </div>

                                            {v.driver && (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                                                        {v.driver.fullName.charAt(0)}
                                                    </div>
                                                    {v.driver.fullName}
                                                </div>
                                            )}
                                            {v.vehicle && (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Truck size={11} />
                                                    {v.vehicle.plateNumber} · {v.vehicle.make} {v.vehicle.model}
                                                </div>
                                            )}

                                            {/* Progress */}
                                            <div>
                                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                    <span>{v.progressPct}% complete · {v.distanceKm}/{v.totalKm} km</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={9} /> {fmtEta(v.etaMinutes)}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-700">
                                                    <div
                                                        className={`h-full rounded-full ${v.status === 'IN_TRANSIT' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                                        style={{ width: `${v.progressPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                    {/* STATUS PANEL */}
                    <div className="w-80 shrink-0 border-l border-[hsl(217,32%,14%)] bg-[hsl(222,40%,7%)] flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-[hsl(217,32%,14%)] flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Active Trips</h2>
                            <div className="flex items-center gap-1.5">
                                {connected
                                    ? <><Wifi size={12} className="text-emerald-400" /><span className="text-[11px] text-emerald-400">Connected</span></>
                                    : <><WifiOff size={12} className="text-red-400" /><span className="text-[11px] text-red-400">Offline</span></>
                                }
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                            {positions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                                    <div className="w-12 h-12 rounded-full bg-[hsl(222,40%,12%)] flex items-center justify-center">
                                        <Navigation size={20} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">No active trips</p>
                                        <p className="text-xs text-slate-700 mt-1">Dispatch a trip to see it on the map</p>
                                    </div>
                                </div>
                            ) : (
                                positions.map((v) => (
                                    <TripCard
                                        key={v.tripId}
                                        v={v}
                                        selected={selectedId === v.tripId}
                                        onClick={() => handleCardClick(v)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Bottom legend */}
                        <div className="px-4 py-3 border-t border-[hsl(217,32%,14%)] flex items-center gap-4 text-[11px] text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                In Transit
                            </span>
                            <span className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                Dispatched
                            </span>
                            <span className="flex items-center gap-1.5 ml-auto text-slate-700 italic">
                                Updates every 4s
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </AppShell>
    )
}

export default FleetTrackingPage
