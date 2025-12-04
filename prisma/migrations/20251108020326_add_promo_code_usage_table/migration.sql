-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PROMO_CODE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROMO_CODE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'PROMO_CODE_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'PROMO_CODE_UNARCHIVED';

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "campaignName" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useTieredDiscounts" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PromoCodeTier" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "tierOrder" INTEGER NOT NULL,
    "startAfterUses" INTEGER NOT NULL DEFAULT 0,
    "maxUsesInTier" INTEGER,
    "percentOff" INTEGER,
    "amountOff" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCodeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "tierId" TEXT,
    "serviceSubscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountApplied" DOUBLE PRECISION NOT NULL,
    "discountType" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoCodeTier_promoCodeId_idx" ON "PromoCodeTier"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoCodeTier_promoCodeId_tierOrder_idx" ON "PromoCodeTier"("promoCodeId", "tierOrder");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage"("promoCodeId");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_userId_idx" ON "PromoCodeUsage"("userId");

-- CreateIndex
CREATE INDEX "PromoCodeUsage_usedAt_idx" ON "PromoCodeUsage"("usedAt");

-- CreateIndex
CREATE INDEX "PromoCode_isArchived_idx" ON "PromoCode"("isArchived");

-- CreateIndex
CREATE INDEX "PromoCode_campaignName_idx" ON "PromoCode"("campaignName");

-- AddForeignKey
ALTER TABLE "PromoCodeTier" ADD CONSTRAINT "PromoCodeTier_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "PromoCodeTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_serviceSubscriptionId_fkey" FOREIGN KEY ("serviceSubscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
