/**
 * Fleet Demo Seed Script
 * Adds 12 IN_TRANSIT + 6 DISPATCHED trips across major Indian cities,
 * with matching vehicles and drivers, to populate the Live Tracking map.
 *
 * Run: ts-node prisma/seedFleet.ts  (from server/ directory)
 */

import { PrismaClient, VehicleStatus, DriverDutyStatus, TripStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Indian routes (all recognised by tracking.service.ts) ───────────────────
const ROUTES = [
    { origin: 'Mumbai', destination: 'Pune', cargo: 'Electronics', weight: 4500, started: hoursAgo(2) },
    { origin: 'Delhi', destination: 'Jaipur', cargo: 'Textiles', weight: 8000, started: hoursAgo(3) },
    { origin: 'Bangalore', destination: 'Chennai', cargo: 'Auto Parts', weight: 6200, started: hoursAgo(5) },
    { origin: 'Hyderabad', destination: 'Visakhapatnam', cargo: 'Steel Coils', weight: 12000, started: hoursAgo(4) },
    { origin: 'Ahmedabad', destination: 'Surat', cargo: 'Chemicals', weight: 7500, started: hoursAgo(1) },
    { origin: 'Kolkata', destination: 'Patna', cargo: 'Pharmaceuticals', weight: 3200, started: hoursAgo(6) },
    { origin: 'Chennai', destination: 'Coimbatore', cargo: 'Food Grains', weight: 9000, started: hoursAgo(2) },
    { origin: 'Pune', destination: 'Nagpur', cargo: 'Machinery', weight: 15000, started: hoursAgo(7) },
    { origin: 'Jaipur', destination: 'Indore', cargo: 'Fertilizers', weight: 11000, started: hoursAgo(3) },
    { origin: 'Lucknow', destination: 'Kanpur', cargo: 'FMCG Goods', weight: 5500, started: hoursAgo(1) },
    { origin: 'Nagpur', destination: 'Bhopal', cargo: 'Cement', weight: 18000, started: hoursAgo(5) },
    { origin: 'Kochi', destination: 'Chennai', cargo: 'Seafood', weight: 2800, started: hoursAgo(4) },
]

const DISPATCHED_ROUTES = [
    { origin: 'Chandigarh', destination: 'Delhi', cargo: 'Garments', weight: 4200 },
    { origin: 'Guwahati', destination: 'Kolkata', cargo: 'Tea', weight: 6000 },
    { origin: 'Vadodara', destination: 'Ahmedabad', cargo: 'Plastics', weight: 7800 },
    { origin: 'Agra', destination: 'Lucknow', cargo: 'Leather Goods', weight: 3500 },
    { origin: 'Indore', destination: 'Bhopal', cargo: 'Soybeans', weight: 9500 },
    { origin: 'Surat', destination: 'Mumbai', cargo: 'Diamonds', weight: 100 },
]

const VEHICLE_MAKES = ['Tata', 'Ashok Leyland', 'Mahindra', 'Eicher', 'BharatBenz', 'Volvo']
const VEHICLE_MODELS = ['Prima 4928', 'U5523 6x4', 'Blazo X 40', 'Pro 6016', 'BS6 4240', 'FM 440']
const VEHICLE_TYPES = ['Truck', 'Trailer', 'Refrigerator Van', 'Tanker', 'Container']
const DRIVER_NAMES = [
    'Ramesh Kumar', 'Suresh Patel', 'Arjun Singh', 'Vijay Sharma',
    'Rajesh Yadav', 'Manoj Tiwari', 'Sanjay Gupta', 'Deepak Joshi',
    'Anil Verma', 'Ravi Nair', 'Sunil Mehta', 'Ajay Pawar',
    'Harish Reddy', 'Prakash Das', 'Naresh Shah', 'Dinesh Chauhan',
    'Mohan Pillai', 'Kiran Rao',
]

function hoursAgo(h: number): Date {
    return new Date(Date.now() - h * 3_600_000)
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function plate(): string {
    const states = ['MH', 'DL', 'KA', 'TN', 'GJ', 'UP', 'WB', 'RJ', 'TS', 'AP']
    const state = pick(states)
    const num = String(Math.floor(10 + Math.random() * 90))
    const alpha = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const digits = String(1000 + Math.floor(Math.random() * 9000))
    return `${state}-${num}-${alpha}-${digits}`
}

async function main() {
    console.log('🌱 Seeding fleet demo data…')

    const total = ROUTES.length + DISPATCHED_ROUTES.length
    let driverIdx = 0

    // Create IN_TRANSIT trips
    for (let i = 0; i < ROUTES.length; i++) {
        const route = ROUTES[i]
        const name = DRIVER_NAMES[driverIdx++ % DRIVER_NAMES.length]
        const make = pick(VEHICLE_MAKES)
        const model = pick(VEHICLE_MODELS)
        const type = pick(VEHICLE_TYPES)

        const driver = await prisma.driver.create({
            data: {
                fullName: name,
                licenseNo: `DL-DEMO-${String(i + 100).padStart(4, '0')}`,
                dutyStatus: DriverDutyStatus.ON_DUTY,
                violations: Math.floor(Math.random() * 3),
                lateTrips: Math.floor(Math.random() * 5),
            },
        })

        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber: plate(),
                make,
                model,
                year: 2020 + Math.floor(Math.random() * 4),
                type,
                status: VehicleStatus.ON_TRIP,
                fuelLevel: 30 + Math.random() * 60,
                mileage: 50000 + Math.floor(Math.random() * 100000),
                maxPayload: 20,
            },
        })

        await prisma.trip.create({
            data: {
                status: TripStatus.IN_TRANSIT,
                origin: route.origin,
                destination: route.destination,
                cargo: route.cargo,
                cargoWeight: route.weight,
                estimatedFuelCost: route.weight * 0.04,
                vehicleId: vehicle.id,
                driverId: driver.id,
                startedAt: route.started,
            },
        })

        console.log(`  ✅ IN_TRANSIT  #${i + 1}: ${route.origin} → ${route.destination} (${name})`)
    }

    // Create DISPATCHED trips
    for (let i = 0; i < DISPATCHED_ROUTES.length; i++) {
        const route = DISPATCHED_ROUTES[i]
        const name = DRIVER_NAMES[driverIdx++ % DRIVER_NAMES.length]
        const make = pick(VEHICLE_MAKES)
        const model = pick(VEHICLE_MODELS)

        const driver = await prisma.driver.create({
            data: {
                fullName: name,
                licenseNo: `DL-DEMO-D${String(i + 200).padStart(4, '0')}`,
                dutyStatus: DriverDutyStatus.ON_DUTY,
            },
        })

        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber: plate(),
                make,
                model,
                year: 2021 + Math.floor(Math.random() * 3),
                type: 'Truck',
                status: VehicleStatus.ON_TRIP,
                fuelLevel: 60 + Math.random() * 40,
                mileage: 20000 + Math.floor(Math.random() * 80000),
                maxPayload: 20,
            },
        })

        await prisma.trip.create({
            data: {
                status: TripStatus.DISPATCHED,
                origin: route.origin,
                destination: route.destination,
                cargo: route.cargo,
                cargoWeight: route.weight,
                vehicleId: vehicle.id,
                driverId: driver.id,
            },
        })

        console.log(`  🟡 DISPATCHED  #${ROUTES.length + i + 1}: ${route.origin} → ${route.destination} (${name})`)
    }

    console.log(`\n✨ Seeded ${total} trips (${ROUTES.length} in transit, ${DISPATCHED_ROUTES.length} dispatched).`)
    console.log('   Restart the server and open /fleet to see all vehicles on the map.')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
