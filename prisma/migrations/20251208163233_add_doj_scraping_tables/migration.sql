-- CreateEnum
CREATE TYPE "DOJClaimCategory" AS ENUM ('DOWNWINDER', 'ONSITE_PARTICIPANT', 'MANHATTAN_PROJECT_WASTE', 'URANIUM_WORKER');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('FASTER', 'SLOWER', 'STABLE');

-- CreateEnum
CREATE TYPE "MetricWindow" AS ENUM ('LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS', 'LAST_60_DAYS', 'ALL_TIME');

-- CreateTable
CREATE TABLE "DOJDailyStats" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimCategory" "DOJClaimCategory" NOT NULL,
    "pending" INTEGER NOT NULL,
    "approved" INTEGER NOT NULL,
    "approvalPercent" DOUBLE PRECISION NOT NULL,
    "dollarsApproved" DOUBLE PRECISION NOT NULL,
    "denied" INTEGER NOT NULL,
    "totalClaims" INTEGER NOT NULL,
    "dailyApproved" INTEGER,
    "dailyDenied" INTEGER,
    "dailySubmitted" INTEGER,
    "approvalRate" DOUBLE PRECISION,
    "dataSource" TEXT NOT NULL DEFAULT 'justice.gov',
    "scrapingSuccess" BOOLEAN NOT NULL DEFAULT true,
    "scrapingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DOJDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DOJProcessingMetrics" (
    "id" TEXT NOT NULL,
    "claimCategory" "DOJClaimCategory" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "windowType" "MetricWindow" NOT NULL,
    "avgApprovalsPerDay" DOUBLE PRECISION NOT NULL,
    "medianApprovalsPerDay" DOUBLE PRECISION NOT NULL,
    "avgSubmissionsPerDay" DOUBLE PRECISION NOT NULL,
    "avgPendingQueue" DOUBLE PRECISION NOT NULL,
    "avgProcessingTime" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION NOT NULL,
    "denialRate" DOUBLE PRECISION NOT NULL,
    "velocityTrend" "TrendDirection" NOT NULL,
    "velocityChange" DOUBLE PRECISION NOT NULL,
    "queueTrend" "TrendDirection" NOT NULL,
    "queueChange" DOUBLE PRECISION NOT NULL,
    "daysInSample" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DOJProcessingMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DOJDailyStats_reportDate_idx" ON "DOJDailyStats"("reportDate");

-- CreateIndex
CREATE INDEX "DOJDailyStats_claimCategory_reportDate_idx" ON "DOJDailyStats"("claimCategory", "reportDate");

-- CreateIndex
CREATE INDEX "DOJDailyStats_scrapedAt_idx" ON "DOJDailyStats"("scrapedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DOJDailyStats_reportDate_claimCategory_key" ON "DOJDailyStats"("reportDate", "claimCategory");

-- CreateIndex
CREATE INDEX "DOJProcessingMetrics_claimCategory_windowType_idx" ON "DOJProcessingMetrics"("claimCategory", "windowType");

-- CreateIndex
CREATE INDEX "DOJProcessingMetrics_calculatedAt_idx" ON "DOJProcessingMetrics"("calculatedAt");
