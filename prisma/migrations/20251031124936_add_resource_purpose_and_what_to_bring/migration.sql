-- AlterTable
ALTER TABLE "DocumentResource" ADD COLUMN     "acceptsMailRequests" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsOnlineRequests" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "appointmentRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "purposeDescription" TEXT,
ADD COLUMN     "whatToBring" TEXT[];
