-- CreateTable
CREATE TABLE "EligibilityEvent" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "result" TEXT,
    "intent" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EligibilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EligibilityEvent_phase_createdAt_idx" ON "EligibilityEvent"("phase", "createdAt");

-- CreateIndex
CREATE INDEX "EligibilityEvent_createdAt_idx" ON "EligibilityEvent"("createdAt");
