-- Intake session collaboration: invites + collaborators

CREATE TYPE "IntakeSessionCollaboratorRole" AS ENUM ('VIEWER', 'CONTRIBUTOR');

CREATE TABLE "IntakeSessionInvite" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "intakeSessionId" TEXT NOT NULL,
  "invitedByUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "IntakeSessionCollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntakeSessionInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntakeSessionInvite_token_key" ON "IntakeSessionInvite"("token");
CREATE INDEX "IntakeSessionInvite_token_idx" ON "IntakeSessionInvite"("token");
CREATE INDEX "IntakeSessionInvite_intakeSessionId_idx" ON "IntakeSessionInvite"("intakeSessionId");
CREATE INDEX "IntakeSessionInvite_email_idx" ON "IntakeSessionInvite"("email");

ALTER TABLE "IntakeSessionInvite" ADD CONSTRAINT "IntakeSessionInvite_intakeSessionId_fkey"
  FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntakeSessionInvite" ADD CONSTRAINT "IntakeSessionInvite_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntakeSessionCollaborator" (
  "id" TEXT NOT NULL,
  "intakeSessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "IntakeSessionCollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
  "invitedByUserId" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntakeSessionCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntakeSessionCollaborator_intakeSessionId_userId_key" ON "IntakeSessionCollaborator"("intakeSessionId", "userId");
CREATE INDEX "IntakeSessionCollaborator_intakeSessionId_idx" ON "IntakeSessionCollaborator"("intakeSessionId");
CREATE INDEX "IntakeSessionCollaborator_userId_idx" ON "IntakeSessionCollaborator"("userId");

ALTER TABLE "IntakeSessionCollaborator" ADD CONSTRAINT "IntakeSessionCollaborator_intakeSessionId_fkey"
  FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntakeSessionCollaborator" ADD CONSTRAINT "IntakeSessionCollaborator_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntakeSessionCollaborator" ADD CONSTRAINT "IntakeSessionCollaborator_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
