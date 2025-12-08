-- DropIndex
DROP INDEX "RecaLibrary_embedding_idx";

-- AlterTable
ALTER TABLE "RecaLibrary" ADD COLUMN     "claimantId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "knowledgeSourceId" TEXT,
ADD COLUMN     "uploadedBy" TEXT;

-- CreateTable
CREATE TABLE "ClaimSubscription" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "serviceSubscriptionId" TEXT NOT NULL,
    "claimOrder" INTEGER NOT NULL,
    "setupFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "setupFeeAmount" DOUBLE PRECISION NOT NULL,
    "setupFeePaidAt" TIMESTAMP(3),
    "setupFeeRefunded" BOOLEAN NOT NULL DEFAULT false,
    "setupFeeRefundedAt" TIMESTAMP(3),
    "monthlyFeeAmount" DOUBLE PRECISION NOT NULL,
    "lawyerTrackNoDiscount" BOOLEAN NOT NULL DEFAULT false,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "claimantId" TEXT,
    "uploadedById" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "claimantId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClaimSubscription_claimantId_key" ON "ClaimSubscription"("claimantId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimSubscription_stripeSubscriptionId_key" ON "ClaimSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "ClaimSubscription_serviceSubscriptionId_idx" ON "ClaimSubscription"("serviceSubscriptionId");

-- CreateIndex
CREATE INDEX "ClaimSubscription_claimantId_idx" ON "ClaimSubscription"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimSubscription_status_idx" ON "ClaimSubscription"("status");

-- CreateIndex
CREATE INDEX "ClaimSubscription_claimOrder_idx" ON "ClaimSubscription"("claimOrder");

-- CreateIndex
CREATE INDEX "KnowledgeSource_claimantId_idx" ON "KnowledgeSource"("claimantId");

-- CreateIndex
CREATE INDEX "KnowledgeSource_isPublic_idx" ON "KnowledgeSource"("isPublic");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_claimantId_idx" ON "ChatSession"("claimantId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "RecaLibrary_claimantId_idx" ON "RecaLibrary"("claimantId");

-- CreateIndex
CREATE INDEX "RecaLibrary_knowledgeSourceId_idx" ON "RecaLibrary"("knowledgeSourceId");

-- AddForeignKey
ALTER TABLE "ClaimSubscription" ADD CONSTRAINT "ClaimSubscription_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimSubscription" ADD CONSTRAINT "ClaimSubscription_serviceSubscriptionId_fkey" FOREIGN KEY ("serviceSubscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecaLibrary" ADD CONSTRAINT "RecaLibrary_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecaLibrary" ADD CONSTRAINT "RecaLibrary_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
