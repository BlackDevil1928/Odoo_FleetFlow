-- AlterEnum
ALTER TYPE "VehicleStatus" ADD VALUE 'RETIRED';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "maxPayload" DOUBLE PRECISION;
