-- CreateEnum
CREATE TYPE "DriverDutyStatus" AS ENUM ('ON_DUTY', 'OFF_DUTY', 'SUSPENDED');

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "dutyStatus" "DriverDutyStatus" NOT NULL DEFAULT 'ON_DUTY',
ADD COLUMN     "lateTrips" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "fuelLiters" DOUBLE PRECISION,
    "fuelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "miscExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_tripId_key" ON "expenses"("tripId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
