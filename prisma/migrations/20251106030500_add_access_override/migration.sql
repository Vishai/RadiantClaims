-- Add access override fields to promo codes
ALTER TABLE "PromoCode"
  ADD COLUMN "accessOverrideEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "accessSeatsTotal" INTEGER,
  ADD COLUMN "accessSeatsUsed" INTEGER NOT NULL DEFAULT 0;

-- Create table to track access-code grants
CREATE TABLE "PromoCodeAccessGrant" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoCodeAccessGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromoCodeAccessGrant_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PromoCodeAccessGrant_promoCodeId_idx" ON "PromoCodeAccessGrant"("promoCodeId");
CREATE INDEX "PromoCodeAccessGrant_email_idx" ON "PromoCodeAccessGrant"("email");
