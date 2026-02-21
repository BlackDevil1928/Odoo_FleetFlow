-- CreateEnum
CREATE TYPE "ServiceLogStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "service_logs" (
    "id" TEXT NOT NULL,
    "logNumber" SERIAL NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "status" "ServiceLogStatus" NOT NULL DEFAULT 'NEW',
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
