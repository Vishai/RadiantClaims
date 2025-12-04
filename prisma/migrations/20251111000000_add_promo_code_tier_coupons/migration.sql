-- AlterTable
ALTER TABLE "PromoCodeTier" ADD COLUMN     "stripeCouponId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PromoCodeTier_stripeCouponId_key" ON "PromoCodeTier"("stripeCouponId");
