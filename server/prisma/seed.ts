import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding FleetFlow demo data...')

    // Drivers
    const drivers = await Promise.all([
        prisma.driver.upsert({
            where: { licenseNo: 'DL-001' },
            update: {},
            create: { fullName: 'John Doe', phone: '+1-555-0101', licenseNo: 'DL-001' },
        }),
        prisma.driver.upsert({
            where: { licenseNo: 'DL-002' },
            update: {},
            create: { fullName: 'Sarah Mitchell', phone: '+1-555-0102', licenseNo: 'DL-002' },
        }),
        prisma.driver.upsert({
            where: { licenseNo: 'DL-003' },
            update: {},
            create: { fullName: 'Carlos Rivera', phone: '+1-555-0103', licenseNo: 'DL-003' },
        }),
    ])

    // Vehicles
    const vehicles = await Promise.all([
        prisma.vehicle.upsert({
            where: { plateNumber: 'FF-1001' },
            update: {},
            create: { plateNumber: 'FF-1001', make: 'Volvo', model: 'FH16', year: 2022, type: 'Truck', status: 'ON_TRIP', fuelLevel: 75 },
        }),
        prisma.vehicle.upsert({
            where: { plateNumber: 'FF-1002' },
            update: {},
            create: { plateNumber: 'FF-1002', make: 'Mercedes', model: 'Actros', year: 2021, type: 'Truck', status: 'ON_TRIP', fuelLevel: 90 },
        }),
        prisma.vehicle.upsert({
            where: { plateNumber: 'FF-1003' },
            update: {},
            create: { plateNumber: 'FF-1003', make: 'DAF', model: 'XF', year: 2023, type: 'Van', status: 'AVAILABLE', fuelLevel: 60 },
        }),
        prisma.vehicle.upsert({
            where: { plateNumber: 'FF-1004' },
            update: {},
            create: { plateNumber: 'FF-1004', make: 'MAN', model: 'TGX', year: 2020, type: 'Truck', status: 'IN_SHOP', fuelLevel: 30 },
        }),
        prisma.vehicle.upsert({
            where: { plateNumber: 'FF-1005' },
            update: {},
            create: { plateNumber: 'FF-1005', make: 'Iveco', model: 'S-Way', year: 2022, type: 'Truck', status: 'AVAILABLE', fuelLevel: 85 },
        }),
    ])

    // Trips
    const tripDefs = [
        { status: 'DISPATCHED' as const, origin: 'New York, NY', destination: 'Boston, MA', cargo: 'Electronics', vehicleIdx: 0, driverIdx: 0 },
        { status: 'IN_TRANSIT' as const, origin: 'Chicago, IL', destination: 'Detroit, MI', cargo: 'Auto Parts', vehicleIdx: 1, driverIdx: 1 },
        { status: 'DRAFT' as const, origin: 'Los Angeles, CA', destination: 'Las Vegas, NV', cargo: 'Furniture', vehicleIdx: null, driverIdx: null },
        { status: 'COMPLETED' as const, origin: 'Houston, TX', destination: 'Dallas, TX', cargo: 'Food Supply', vehicleIdx: 2, driverIdx: 2 },
        { status: 'DRAFT' as const, origin: 'Miami, FL', destination: 'Tampa, FL', cargo: 'Medical Equipment', vehicleIdx: null, driverIdx: null },
        { status: 'CANCELLED' as const, origin: 'Seattle, WA', destination: 'Portland, OR', cargo: 'Timber', vehicleIdx: 4, driverIdx: 0 },
    ]

    for (const t of tripDefs) {
        await prisma.trip.create({
            data: {
                status: t.status,
                origin: t.origin,
                destination: t.destination,
                cargo: t.cargo,
                vehicleId: t.vehicleIdx !== null ? vehicles[t.vehicleIdx].id : null,
                driverId: t.driverIdx !== null ? drivers[t.driverIdx].id : null,
                startedAt: t.status !== 'DRAFT' && t.status !== 'CANCELLED' ? new Date() : null,
                completedAt: t.status === 'COMPLETED' ? new Date() : null,
            },
        })
    }

    console.log('✅ Demo data seeded successfully!')
    console.log(`   Drivers: ${drivers.length}`)
    console.log(`   Vehicles: ${vehicles.length}`)
    console.log(`   Trips: ${tripDefs.length}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
