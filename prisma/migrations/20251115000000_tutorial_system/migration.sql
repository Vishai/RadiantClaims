-- CreateEnum
CREATE TYPE "HelpIntensity" AS ENUM ('MINIMAL', 'BASIC', 'DETAILED');

-- CreateEnum
CREATE TYPE "TutorialStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "TutorialPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tooltipsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "walkthroughsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "helpIntensity" "HelpIntensity" NOT NULL DEFAULT 'DETAILED',
    "pageDismissals" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorialPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" "UserRole",
    "targetPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "triggerEvent" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tutorialId" TEXT NOT NULL,
    "status" "TutorialStatus" NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "dropOffStep" INTEGER,

    CONSTRAINT "TutorialProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialAnalytics" (
    "id" TEXT NOT NULL,
    "tutorialId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalSkipped" INTEGER NOT NULL DEFAULT 0,
    "totalDropped" INTEGER NOT NULL DEFAULT 0,
    "stepDropoffs" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "avgTimePerStep" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorialAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TutorialPreference_userId_key" ON "TutorialPreference"("userId");

-- CreateIndex
CREATE INDEX "TutorialPreference_userId_idx" ON "TutorialPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutorial_key_key" ON "Tutorial"("key");

-- CreateIndex
CREATE INDEX "Tutorial_targetRole_idx" ON "Tutorial"("targetRole");

-- CreateIndex
CREATE INDEX "Tutorial_isActive_idx" ON "Tutorial"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TutorialProgress_userId_tutorialId_key" ON "TutorialProgress"("userId", "tutorialId");

-- CreateIndex
CREATE INDEX "TutorialProgress_userId_idx" ON "TutorialProgress"("userId");

-- CreateIndex
CREATE INDEX "TutorialProgress_tutorialId_idx" ON "TutorialProgress"("tutorialId");

-- CreateIndex
CREATE INDEX "TutorialProgress_status_idx" ON "TutorialProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TutorialAnalytics_tutorialId_date_key" ON "TutorialAnalytics"("tutorialId", "date");

-- CreateIndex
CREATE INDEX "TutorialAnalytics_tutorialId_idx" ON "TutorialAnalytics"("tutorialId");

-- CreateIndex
CREATE INDEX "TutorialAnalytics_date_idx" ON "TutorialAnalytics"("date");

-- AddForeignKey
ALTER TABLE "TutorialPreference" ADD CONSTRAINT "TutorialPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialProgress" ADD CONSTRAINT "TutorialProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialProgress" ADD CONSTRAINT "TutorialProgress_tutorialId_fkey" FOREIGN KEY ("tutorialId") REFERENCES "Tutorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialAnalytics" ADD CONSTRAINT "TutorialAnalytics_tutorialId_fkey" FOREIGN KEY ("tutorialId") REFERENCES "Tutorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
