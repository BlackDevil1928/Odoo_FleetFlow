// City coordinates for major Indian cities — used to simulate GPS positions
// when no real device is attached. Keys are lowercase for fuzzy matching.

export interface LatLng { lat: number; lng: number }

const CITY_COORDS: Record<string, LatLng> = {
    mumbai: { lat: 19.0760, lng: 72.8777 },
    delhi: { lat: 28.6139, lng: 77.2090 },
    'new delhi': { lat: 28.6139, lng: 77.2090 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    hyderabad: { lat: 17.3850, lng: 78.4867 },
    pune: { lat: 18.5204, lng: 73.8567 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    ahmedabad: { lat: 23.0225, lng: 72.5714 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
    surat: { lat: 21.1702, lng: 72.8311 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
    kanpur: { lat: 26.4499, lng: 80.3319 },
    nagpur: { lat: 21.1458, lng: 79.0882 },
    indore: { lat: 22.7196, lng: 75.8577 },
    bhopal: { lat: 23.2599, lng: 77.4126 },
    visakhapatnam: { lat: 17.6868, lng: 83.2185 },
    patna: { lat: 25.5941, lng: 85.1376 },
    vadodara: { lat: 22.3072, lng: 73.1812 },
    agra: { lat: 27.1767, lng: 78.0081 },
    coimbatore: { lat: 11.0168, lng: 76.9558 },
    kochi: { lat: 9.9312, lng: 76.2673 },
    chandigarh: { lat: 30.7333, lng: 76.7794 },
    guwahati: { lat: 26.1445, lng: 91.7362 },
}

/** Fuzzy-match a place name to known Indian city coordinates.
 *  Returns null if no match is found (prevents phantom markers). */
export function getCityCoords(name: string): LatLng | null {
    if (!name) return null
    const key = name.trim().toLowerCase()

    // Exact match
    if (CITY_COORDS[key]) return CITY_COORDS[key]

    // Partial match — city name appears anywhere in origin/destination string
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
        if (key.includes(city) || city.includes(key)) return coords
    }

    return null   // unknown / foreign city — caller should skip this trip
}

// Average speed used for ETA simulation (km/h)
const AVG_SPEED_KMH = 60

/** Compute straight-line distance between two lat/lng points (haversine, km). */
export function haversineKm(a: LatLng, b: LatLng): number {
    const R = 6371
    const dLat = ((b.lat - a.lat) * Math.PI) / 180
    const dLng = ((b.lng - a.lng) * Math.PI) / 180
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.asin(Math.sqrt(x))
}

export interface PositionResult {
    lat: number
    lng: number
    progressPct: number   // 0–100
    distanceKm: number
    etaMinutes: number    // remaining travel time
    totalKm: number
}

/** Linear interpolation of position along origin→dest.
 *  Returns null when NEITHER endpoint maps to a known Indian city — those trips
 *  are silently excluded from the map instead of showing at a wrong location. */
export function interpolatePosition(
    origin: string,
    destination: string,
    startedAt: Date | null,
): PositionResult | null {
    const from = getCityCoords(origin)
    const to = getCityCoords(destination)

    // Both cities unknown → skip (prevents markers for US/foreign trips)
    if (!from && !to) return null

    // If only one endpoint is known, keep the vehicle stationary at that point
    const resolvedFrom = from ?? to!
    const resolvedTo = to ?? from!
    const totalKm = haversineKm(resolvedFrom, resolvedTo)

    if (!startedAt) {
        return { lat: resolvedFrom.lat, lng: resolvedFrom.lng, progressPct: 0, distanceKm: 0, etaMinutes: Math.round(totalKm / AVG_SPEED_KMH * 60), totalKm: Math.round(totalKm) }
    }

    const elapsedHours = (Date.now() - new Date(startedAt).getTime()) / 3_600_000
    const travelledKm = Math.min(elapsedHours * AVG_SPEED_KMH, totalKm)
    const progressPct = totalKm > 0 ? Math.min(100, (travelledKm / totalKm) * 100) : 0
    const t = progressPct / 100

    return {
        lat: resolvedFrom.lat + (resolvedTo.lat - resolvedFrom.lat) * t,
        lng: resolvedFrom.lng + (resolvedTo.lng - resolvedFrom.lng) * t,
        progressPct: Math.round(progressPct),
        distanceKm: Math.round(travelledKm),
        etaMinutes: Math.max(0, Math.round(((totalKm - travelledKm) / AVG_SPEED_KMH) * 60)),
        totalKm: Math.round(totalKm),
    }
}
