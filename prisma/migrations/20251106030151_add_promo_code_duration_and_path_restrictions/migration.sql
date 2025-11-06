-- CreateEnum
CREATE TYPE "PromoCodeDuration" AS ENUM ('ONCE', 'REPEATING', 'FOREVER');

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "allowedTiers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "duration" "PromoCodeDuration" NOT NULL DEFAULT 'ONCE',
ADD COLUMN     "durationInMonths" INTEGER;
