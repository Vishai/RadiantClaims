-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'ATTORNEY', 'FIRM_ADMIN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID', 'Medical', 'ProofOfResidency', 'Other');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "IntakeStep" AS ENUM ('SCREENING', 'IDENTITY', 'RESIDENCE', 'MEDICAL', 'ADDITIONAL', 'CONSENT', 'REVIEW');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('PANCREATIC_CANCER', 'THYROID_CANCER', 'KIDNEY_CANCER', 'LUNG_CANCER', 'BRAIN_CANCER', 'OTHER_CANCER', 'NON_CANCER', 'DOWNWINDER', 'URANIUM_WORKER', 'MANHATTAN_PROJECT_WASTE', 'ONSITE_PARTICIPANT');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'REJECTED', 'VALIDATED', 'AWAITING_REVIEW', 'APPROVED');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('IDENTITY', 'PROOF_OF_RESIDENCE', 'PATHOLOGY_REPORT', 'MEDICAL_RECORDS', 'DISCHARGE_SUMMARY', 'TUMOR_REGISTRY', 'TREATMENT_RECORDS', 'UTILITY_BILL', 'MORTGAGE_STATEMENT', 'TAX_RETURN', 'SCHOOL_RECORDS', 'EMPLOYMENT_RECORDS', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('RECORDS_AUTHORIZATION', 'ATTORNEY_SHARING', 'HIPAA_AUTHORIZATION', 'E_SIGNATURE');

-- CreateEnum
CREATE TYPE "PacketStatus" AS ENUM ('GENERATING', 'READY', 'DELIVERED', 'FAILED', 'PRINTED', 'READY_TO_MAIL', 'MAILED_BY_CLIENT');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'RESUME_LINK', 'UPLOAD_CONFIRMATION', 'PACKET_READY', 'DOCUMENT_VALIDATED', 'READY_TO_MAIL', 'MARKETING', 'UPDATES');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'MFA_ENABLED', 'MFA_DISABLED', 'SESSION_CREATED', 'SESSION_TERMINATED', 'CLAIMANT_VIEWED', 'CLAIMANT_CREATED', 'CLAIMANT_UPDATED', 'CLAIMANT_DELETED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VIEWED', 'DOCUMENT_DOWNLOADED', 'DOCUMENT_DELETED', 'INTAKE_STARTED', 'INTAKE_COMPLETED', 'PACKET_GENERATED', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'PERMISSION_DENIED', 'FIRM_CREATED', 'FIRM_UPDATED', 'FIRM_SUSPENDED', 'ATTORNEY_INVITED', 'ATTORNEY_REMOVED', 'CLAIMANT_ASSIGNED', 'CLAIMANT_UNASSIGNED', 'POLICY_ACCEPTED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'REVIEW_APPROVED', 'REVIEW_REJECTED', 'REVISION_REQUESTED', 'NOTIFICATION_SENT', 'WORKFLOW_STATUS_CHANGED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPGRADED', 'SUBSCRIPTION_DOWNGRADED', 'SUBSCRIPTION_CANCELED', 'SUBSCRIPTION_REACTIVATED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'REFUND_REQUESTED', 'REFUND_PROCESSED', 'FIRM_SERVICE_FEE_PAID', 'PDF_DOWNLOADED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MFAMethod" AS ENUM ('TOTP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "FirmStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "ClaimantWorkflowStatus" AS ENUM ('INTAKE', 'DOCUMENTS_PENDING', 'INTERNAL_REVIEW', 'READY_FOR_ATTORNEY', 'ATTORNEY_REVIEWING', 'REVISION_REQUESTED', 'ATTORNEY_APPROVED', 'PACKET_PRINTED', 'MAILING_READY', 'CLIENT_MAILED', 'DOJ_SUBMITTED', 'DOJ_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('CONFIDENTIALITY_DATA_ACCESS', 'SERVICE_PROVIDER_AGREEMENT', 'HIPAA_BAA', 'TERMS_OF_SERVICE');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('GENERAL', 'REVISION_REQUEST', 'APPROVAL_NOTE', 'INTERNAL_NOTE');

-- CreateEnum
CREATE TYPE "ReviewActionType" AS ENUM ('APPROVED', 'REJECTED', 'REQUEST_REVISION', 'REQUEST_INFO', 'MARK_VALIDATED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PACKET_READY_FOR_REVIEW', 'REVISION_REQUESTED', 'ATTORNEY_APPROVED', 'COMMENT_ADDED', 'DOCUMENT_UPLOADED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RECAFormType" AS ENUM ('DOWNWINDER', 'URANIUM_WORKER', 'MANHATTAN_PROJECT_WASTE', 'GENERAL_RECA');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('VITAL_RECORDS', 'COUNTY_CLERK', 'COUNTY_RECORDER', 'COUNTY_ASSESSOR', 'COUNTY_TREASURER', 'DISTRICT_COURT', 'STATE_ARCHIVES', 'TAX_COMMISSION', 'DMV', 'HOSPITAL', 'CANCER_REGISTRY', 'RADIATION_CONTROL', 'SCHOOL_DISTRICT', 'UNIVERSITY', 'CHURCH', 'TRIBAL_OFFICE', 'TRIBAL_VITAL_RECORDS', 'FEDERAL_ARCHIVES', 'IRS', 'SOCIAL_SECURITY', 'MINING_ADMINISTRATION');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SELF', 'SPOUSE', 'CHILD', 'PARENT', 'GRANDCHILD', 'GRANDPARENT');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('HIGH', 'MEDIUM', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "DocumentStatusType" AS ENUM ('NOT_STARTED', 'REQUESTED', 'AWAITING', 'RECEIVED', 'UPLOADED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DOJMilestone" AS ENUM ('NOT_SUBMITTED', 'RECEIVED_BY_DOJ', 'INITIAL_REVIEW', 'INCOMPLETE_RETURNED', 'DOCUMENT_VERIFICATION', 'REQUESTING_ADDITIONAL_DOCS', 'CANCER_REGISTRY_LOOKUP', 'MEDICAL_RECORDS_REQUEST', 'ELIGIBILITY_REVIEW', 'EXPOSURE_VERIFICATION', 'DISEASE_VERIFICATION', 'RELATIONSHIP_VERIFICATION', 'FINAL_REVIEW', 'APPROVED_PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_ISSUED', 'CLAIM_APPROVED', 'CLAIM_DENIED', 'CLAIM_WITHDRAWN', 'APPEAL_IN_PROGRESS', 'APPEAL_APPROVED', 'APPEAL_DENIED');

-- CreateEnum
CREATE TYPE "ServiceTier" AS ENUM ('DIY_PREP', 'LEGAL_REP');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SETUP_FEE', 'MONTHLY_FEE', 'FIRM_SERVICE_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "firmId" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetRequired" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrerName" TEXT NOT NULL,
    "contact" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claimant" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "referralCode" TEXT,
    "claimType" "ClaimType",
    "relationshipToClaimant" "RelationshipType",
    "cancerType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claimant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeSession" (
    "id" TEXT NOT NULL,
    "resumeToken" TEXT NOT NULL,
    "claimantId" TEXT,
    "currentStep" "IntakeStep" NOT NULL DEFAULT 'SCREENING',
    "status" "IntakeStatus" NOT NULL DEFAULT 'DRAFT',
    "claimType" "ClaimType",
    "isPremiumService" BOOLEAN NOT NULL DEFAULT false,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recaWorkflowStage" INTEGER,
    "recaWorkflowSection" TEXT,
    "recaFormData" JSONB,
    "recaEligibilityData" JSONB,
    "recaCompletionPercent" INTEGER DEFAULT 0,
    "recaSupportingForms" JSONB,
    "recaValidationErrors" JSONB,
    "recaFormPdfGenerated" BOOLEAN NOT NULL DEFAULT false,
    "recaFormPdfGeneratedAt" TIMESTAMP(3),
    "recaFormPdfDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "recaFormPdfDownloadedAt" TIMESTAMP(3),
    "recaFormPdfDownloadCount" INTEGER NOT NULL DEFAULT 0,
    "serviceSubscriptionId" TEXT,

    CONSTRAINT "IntakeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeResponse" (
    "id" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "normalizedName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" "FileCategory",
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADING',
    "ocrText" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "metadata" TEXT,
    "thumbnailKey" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiresOriginal" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTag" (
    "id" TEXT NOT NULL,
    "uploadedFileId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "consentText" TEXT NOT NULL,
    "signatureData" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "agreedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacketSubmission" (
    "id" TEXT NOT NULL,
    "intakeSessionId" TEXT NOT NULL,
    "packetFileKey" TEXT,
    "status" "PacketStatus" NOT NULL DEFAULT 'GENERATING',
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "totalSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliveredTo" TEXT,
    "printedAt" TIMESTAMP(3),
    "printedBy" TEXT,
    "mailingInstructions" TEXT,
    "trackingNumber" TEXT,
    "prepaidEnvelopeIssued" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PacketSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurisdictionRequirement" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "county" TEXT,
    "documentCategory" TEXT NOT NULL,
    "requiresOriginal" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "specificInstructions" TEXT,
    "helpfulLinks" TEXT,
    "exampleDocuments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JurisdictionRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailPreference" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailType" "EmailType" NOT NULL,
    "isUnsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "metadata" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MFAConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "MFAMethod" NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MFAConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RememberMeToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RememberMeToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawFirm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "FirmStatus" NOT NULL DEFAULT 'ACTIVE',
    "licenseNumber" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "serviceAgreementUrl" TEXT,
    "serviceAgreementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawFirm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimantAssignment" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "status" "ClaimantWorkflowStatus" NOT NULL DEFAULT 'INTAKE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimantAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firmId" TEXT,
    "policyType" "PolicyType" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "policyText" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimantComment" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "commentType" "CommentType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "relatedFileId" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "parentCommentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimantComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAction" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "actionType" "ReviewActionType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "claimantId" TEXT,
    "actionUrl" TEXT,
    "metadata" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RECAForm" (
    "id" TEXT NOT NULL,
    "formType" "RECAFormType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "oMBApprovalNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RECAForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentResource" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "county" TEXT,
    "resourceType" "ResourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "address" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "stateCode" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "phoneTollFree" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "documentTypesProvided" TEXT[],
    "certificationAvailable" BOOLEAN NOT NULL DEFAULT true,
    "processingTimeDays" INTEGER,
    "specialInstructions" TEXT,
    "isTribal" BOOLEAN NOT NULL DEFAULT false,
    "tribalAffiliation" TEXT,

    CONSTRAINT "DocumentResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL,
    "claimType" "ClaimType",
    "relationshipToClaimant" "RelationshipType" NOT NULL,
    "documentType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiresCertification" BOOLEAN NOT NULL,
    "acceptsDigital" BOOLEAN NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "priority" "RequirementPriority" NOT NULL,
    "resourceTypes" "ResourceType"[],
    "notes" TEXT,
    "formSection" TEXT,
    "multipleRequired" BOOLEAN NOT NULL DEFAULT false,
    "quantityRequired" INTEGER,
    "exampleDocuments" TEXT[],

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecordRequirement" (
    "id" TEXT NOT NULL,
    "cancerType" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "formSection" TEXT,

    CONSTRAINT "MedicalRecordRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimantDocumentStatus" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" "DocumentStatusType" NOT NULL,
    "requestedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "uploadedDate" TIMESTAMP(3),
    "notes" TEXT,
    "resourceContactedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimantDocumentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimLifecycle" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "currentMilestone" "DOJMilestone" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "currentMilestoneDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedToRadiantAt" TIMESTAMP(3),
    "submittedToDOJAt" TIMESTAMP(3),
    "receivedByDOJAt" TIMESTAMP(3),
    "completenessReviewAt" TIMESTAMP(3),
    "eligibilityReviewAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "paymentIssuedAt" TIMESTAMP(3),
    "paymentReceivedAt" TIMESTAMP(3),
    "dojClaimNumber" TEXT,
    "expectedCompletionDate" TIMESTAMP(3),
    "estimatedPayoutDate" TIMESTAMP(3),
    "daysInCurrentMilestone" INTEGER NOT NULL DEFAULT 0,
    "totalProcessingDays" INTEGER NOT NULL DEFAULT 0,
    "cancerRegistryChecked" BOOLEAN NOT NULL DEFAULT false,
    "cancerRegistryFoundAt" TIMESTAMP(3),
    "medicalRecordsRequested" BOOLEAN NOT NULL DEFAULT false,
    "medicalRecordsReceivedByDOJ" BOOLEAN NOT NULL DEFAULT false,
    "lastDOJContactDate" TIMESTAMP(3),
    "lastDOJContactMethod" TEXT,
    "lastDOJContactNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimLifecycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimMilestoneEvent" (
    "id" TEXT NOT NULL,
    "lifecycleId" TEXT NOT NULL,
    "milestone" "DOJMilestone" NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysToAchieve" INTEGER,
    "notes" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "notifiedClaimant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClaimMilestoneEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimStatistics" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalClaimsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "totalClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "totalClaimsDenied" INTEGER NOT NULL DEFAULT 0,
    "totalClaimsInProgress" INTEGER NOT NULL DEFAULT 0,
    "avgTimeToReceipt" DOUBLE PRECISION,
    "avgTimeToInitialReview" DOUBLE PRECISION,
    "avgTimeToCancerRegistry" DOUBLE PRECISION,
    "avgTimeToEligibility" DOUBLE PRECISION,
    "avgTimeToApproval" DOUBLE PRECISION,
    "avgTimeToPayment" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION,
    "completenessRate" DOUBLE PRECISION,
    "downwinderApprovals" INTEGER NOT NULL DEFAULT 0,
    "downwinderDenials" INTEGER NOT NULL DEFAULT 0,
    "downwinderAvgDays" DOUBLE PRECISION,
    "utahClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "idahoClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "newMexicoClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "arizonaClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "nevadaClaimsApproved" INTEGER NOT NULL DEFAULT 0,
    "leukemiaApprovalRate" DOUBLE PRECISION,
    "thyroidApprovalRate" DOUBLE PRECISION,
    "breastApprovalRate" DOUBLE PRECISION,
    "lungApprovalRate" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSource" TEXT,

    CONSTRAINT "ClaimStatistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimQueuePosition" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "estimatedPosition" INTEGER,
    "totalInQueue" INTEGER,
    "cohortId" TEXT,
    "cohortSize" INTEGER,
    "cohortApproved" INTEGER,
    "cohortDenied" INTEGER,
    "percentFasterThan" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimQueuePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleNotificationPreference" (
    "id" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "notifyOnMilestone" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDocumentRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnApproval" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPayment" BOOLEAN NOT NULL DEFAULT true,
    "weeklyProgressUpdate" BOOLEAN NOT NULL DEFAULT true,
    "maxNotificationsPerWeek" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifecycleNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "ServiceTier" NOT NULL DEFAULT 'DIY_PREP',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "setupFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "setupFeeAmount" DOUBLE PRECISION,
    "setupFeePaidAt" TIMESTAMP(3),
    "monthlyFeeAmount" DOUBLE PRECISION,
    "billingCycleDay" INTEGER,
    "nextBillingDate" TIMESTAMP(3),
    "lastBillingDate" TIMESTAMP(3),
    "referredToFirmId" TEXT,
    "referredAt" TIMESTAMP(3),
    "firmServiceFee" DOUBLE PRECISION,
    "firmServiceFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "firmServiceFeePaidAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeInvoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Claimant_userId_idx" ON "Claimant"("userId");

-- CreateIndex
CREATE INDEX "Claimant_email_idx" ON "Claimant"("email");

-- CreateIndex
CREATE INDEX "Claimant_lastName_idx" ON "Claimant"("lastName");

-- CreateIndex
CREATE INDEX "Claimant_state_idx" ON "Claimant"("state");

-- CreateIndex
CREATE INDEX "Claimant_referralCode_idx" ON "Claimant"("referralCode");

-- CreateIndex
CREATE INDEX "Document_claimantId_idx" ON "Document"("claimantId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSession_resumeToken_key" ON "IntakeSession"("resumeToken");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSession_claimantId_key" ON "IntakeSession"("claimantId");

-- CreateIndex
CREATE INDEX "IntakeSession_resumeToken_idx" ON "IntakeSession"("resumeToken");

-- CreateIndex
CREATE INDEX "IntakeSession_claimantId_idx" ON "IntakeSession"("claimantId");

-- CreateIndex
CREATE INDEX "IntakeSession_status_idx" ON "IntakeSession"("status");

-- CreateIndex
CREATE INDEX "IntakeSession_expiresAt_idx" ON "IntakeSession"("expiresAt");

-- CreateIndex
CREATE INDEX "IntakeSession_recaWorkflowStage_idx" ON "IntakeSession"("recaWorkflowStage");

-- CreateIndex
CREATE INDEX "IntakeSession_serviceSubscriptionId_idx" ON "IntakeSession"("serviceSubscriptionId");

-- CreateIndex
CREATE INDEX "IntakeResponse_intakeSessionId_idx" ON "IntakeResponse"("intakeSessionId");

-- CreateIndex
CREATE INDEX "IntakeResponse_questionKey_idx" ON "IntakeResponse"("questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeResponse_intakeSessionId_questionKey_key" ON "IntakeResponse"("intakeSessionId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedFile_fileKey_key" ON "UploadedFile"("fileKey");

-- CreateIndex
CREATE INDEX "UploadedFile_intakeSessionId_idx" ON "UploadedFile"("intakeSessionId");

-- CreateIndex
CREATE INDEX "UploadedFile_fileKey_idx" ON "UploadedFile"("fileKey");

-- CreateIndex
CREATE INDEX "UploadedFile_category_idx" ON "UploadedFile"("category");

-- CreateIndex
CREATE INDEX "UploadedFile_status_idx" ON "UploadedFile"("status");

-- CreateIndex
CREATE INDEX "DocumentTag_uploadedFileId_idx" ON "DocumentTag"("uploadedFileId");

-- CreateIndex
CREATE INDEX "DocumentTag_tag_idx" ON "DocumentTag"("tag");

-- CreateIndex
CREATE INDEX "ConsentRecord_intakeSessionId_idx" ON "ConsentRecord"("intakeSessionId");

-- CreateIndex
CREATE INDEX "ConsentRecord_consentType_idx" ON "ConsentRecord"("consentType");

-- CreateIndex
CREATE UNIQUE INDEX "PacketSubmission_intakeSessionId_key" ON "PacketSubmission"("intakeSessionId");

-- CreateIndex
CREATE INDEX "PacketSubmission_status_idx" ON "PacketSubmission"("status");

-- CreateIndex
CREATE INDEX "PacketSubmission_generatedAt_idx" ON "PacketSubmission"("generatedAt");

-- CreateIndex
CREATE INDEX "JurisdictionRequirement_state_idx" ON "JurisdictionRequirement"("state");

-- CreateIndex
CREATE INDEX "JurisdictionRequirement_state_county_idx" ON "JurisdictionRequirement"("state", "county");

-- CreateIndex
CREATE UNIQUE INDEX "JurisdictionRequirement_state_county_documentCategory_key" ON "JurisdictionRequirement"("state", "county", "documentCategory");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreference_unsubscribeToken_key" ON "EmailPreference"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "EmailPreference_email_idx" ON "EmailPreference"("email");

-- CreateIndex
CREATE INDEX "EmailPreference_unsubscribeToken_idx" ON "EmailPreference"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreference_email_emailType_key" ON "EmailPreference"("email", "emailType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "MFAConfig_userId_key" ON "MFAConfig"("userId");

-- CreateIndex
CREATE INDEX "MFAConfig_userId_idx" ON "MFAConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RememberMeToken_token_key" ON "RememberMeToken"("token");

-- CreateIndex
CREATE INDEX "RememberMeToken_userId_idx" ON "RememberMeToken"("userId");

-- CreateIndex
CREATE INDEX "RememberMeToken_token_idx" ON "RememberMeToken"("token");

-- CreateIndex
CREATE INDEX "RememberMeToken_expires_idx" ON "RememberMeToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "LawFirm_slug_key" ON "LawFirm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LawFirm_email_key" ON "LawFirm"("email");

-- CreateIndex
CREATE INDEX "LawFirm_slug_idx" ON "LawFirm"("slug");

-- CreateIndex
CREATE INDEX "LawFirm_status_idx" ON "LawFirm"("status");

-- CreateIndex
CREATE INDEX "LawFirm_email_idx" ON "LawFirm"("email");

-- CreateIndex
CREATE INDEX "ClaimantAssignment_claimantId_idx" ON "ClaimantAssignment"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimantAssignment_firmId_idx" ON "ClaimantAssignment"("firmId");

-- CreateIndex
CREATE INDEX "ClaimantAssignment_status_idx" ON "ClaimantAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimantAssignment_claimantId_firmId_key" ON "ClaimantAssignment"("claimantId", "firmId");

-- CreateIndex
CREATE INDEX "PolicyAcceptance_userId_idx" ON "PolicyAcceptance"("userId");

-- CreateIndex
CREATE INDEX "PolicyAcceptance_firmId_idx" ON "PolicyAcceptance"("firmId");

-- CreateIndex
CREATE INDEX "PolicyAcceptance_policyType_idx" ON "PolicyAcceptance"("policyType");

-- CreateIndex
CREATE INDEX "ClaimantComment_claimantId_idx" ON "ClaimantComment"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimantComment_authorId_idx" ON "ClaimantComment"("authorId");

-- CreateIndex
CREATE INDEX "ClaimantComment_commentType_idx" ON "ClaimantComment"("commentType");

-- CreateIndex
CREATE INDEX "ClaimantComment_isResolved_idx" ON "ClaimantComment"("isResolved");

-- CreateIndex
CREATE INDEX "ClaimantComment_createdAt_idx" ON "ClaimantComment"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewAction_claimantId_idx" ON "ReviewAction"("claimantId");

-- CreateIndex
CREATE INDEX "ReviewAction_reviewerId_idx" ON "ReviewAction"("reviewerId");

-- CreateIndex
CREATE INDEX "ReviewAction_actionType_idx" ON "ReviewAction"("actionType");

-- CreateIndex
CREATE INDEX "ReviewAction_createdAt_idx" ON "ReviewAction"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RECAForm_formType_key" ON "RECAForm"("formType");

-- CreateIndex
CREATE INDEX "RECAForm_formType_idx" ON "RECAForm"("formType");

-- CreateIndex
CREATE INDEX "DocumentResource_state_county_idx" ON "DocumentResource"("state", "county");

-- CreateIndex
CREATE INDEX "DocumentResource_resourceType_idx" ON "DocumentResource"("resourceType");

-- CreateIndex
CREATE INDEX "DocumentResource_state_resourceType_idx" ON "DocumentResource"("state", "resourceType");

-- CreateIndex
CREATE INDEX "DocumentRequirement_claimType_idx" ON "DocumentRequirement"("claimType");

-- CreateIndex
CREATE INDEX "DocumentRequirement_relationshipToClaimant_idx" ON "DocumentRequirement"("relationshipToClaimant");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirement_claimType_relationshipToClaimant_docume_key" ON "DocumentRequirement"("claimType", "relationshipToClaimant", "documentType");

-- CreateIndex
CREATE INDEX "MedicalRecordRequirement_cancerType_idx" ON "MedicalRecordRequirement"("cancerType");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecordRequirement_cancerType_recordType_key" ON "MedicalRecordRequirement"("cancerType", "recordType");

-- CreateIndex
CREATE INDEX "ClaimantDocumentStatus_claimantId_idx" ON "ClaimantDocumentStatus"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimantDocumentStatus_status_idx" ON "ClaimantDocumentStatus"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimantDocumentStatus_claimantId_documentType_key" ON "ClaimantDocumentStatus"("claimantId", "documentType");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimLifecycle_claimantId_key" ON "ClaimLifecycle"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimLifecycle_currentMilestone_idx" ON "ClaimLifecycle"("currentMilestone");

-- CreateIndex
CREATE INDEX "ClaimLifecycle_submittedToDOJAt_idx" ON "ClaimLifecycle"("submittedToDOJAt");

-- CreateIndex
CREATE INDEX "ClaimLifecycle_dojClaimNumber_idx" ON "ClaimLifecycle"("dojClaimNumber");

-- CreateIndex
CREATE INDEX "ClaimMilestoneEvent_lifecycleId_idx" ON "ClaimMilestoneEvent"("lifecycleId");

-- CreateIndex
CREATE INDEX "ClaimMilestoneEvent_milestone_idx" ON "ClaimMilestoneEvent"("milestone");

-- CreateIndex
CREATE INDEX "ClaimMilestoneEvent_achievedAt_idx" ON "ClaimMilestoneEvent"("achievedAt");

-- CreateIndex
CREATE INDEX "ClaimStatistics_periodStart_periodEnd_idx" ON "ClaimStatistics"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ClaimStatistics_lastUpdated_idx" ON "ClaimStatistics"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimQueuePosition_claimantId_key" ON "ClaimQueuePosition"("claimantId");

-- CreateIndex
CREATE INDEX "ClaimQueuePosition_cohortId_idx" ON "ClaimQueuePosition"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleNotificationPreference_claimantId_key" ON "LifecycleNotificationPreference"("claimantId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_userId_key" ON "ServiceSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_stripeCustomerId_key" ON "ServiceSubscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_stripeSubscriptionId_key" ON "ServiceSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_userId_idx" ON "ServiceSubscription"("userId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_tier_idx" ON "ServiceSubscription"("tier");

-- CreateIndex
CREATE INDEX "ServiceSubscription_status_idx" ON "ServiceSubscription"("status");

-- CreateIndex
CREATE INDEX "ServiceSubscription_nextBillingDate_idx" ON "ServiceSubscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "ServiceSubscription_referredToFirmId_idx" ON "ServiceSubscription"("referredToFirmId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_paymentType_idx" ON "Payment"("paymentType");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claimant" ADD CONSTRAINT "Claimant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claimant" ADD CONSTRAINT "Claimant_referralCode_fkey" FOREIGN KEY ("referralCode") REFERENCES "Referral"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSession" ADD CONSTRAINT "IntakeSession_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeSession" ADD CONSTRAINT "IntakeSession_serviceSubscriptionId_fkey" FOREIGN KEY ("serviceSubscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeResponse" ADD CONSTRAINT "IntakeResponse_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "UploadedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PacketSubmission" ADD CONSTRAINT "PacketSubmission_intakeSessionId_fkey" FOREIGN KEY ("intakeSessionId") REFERENCES "IntakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFAConfig" ADD CONSTRAINT "MFAConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RememberMeToken" ADD CONSTRAINT "RememberMeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantAssignment" ADD CONSTRAINT "ClaimantAssignment_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantAssignment" ADD CONSTRAINT "ClaimantAssignment_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcceptance" ADD CONSTRAINT "PolicyAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAcceptance" ADD CONSTRAINT "PolicyAcceptance_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "LawFirm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantComment" ADD CONSTRAINT "ClaimantComment_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantComment" ADD CONSTRAINT "ClaimantComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantComment" ADD CONSTRAINT "ClaimantComment_relatedFileId_fkey" FOREIGN KEY ("relatedFileId") REFERENCES "UploadedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantComment" ADD CONSTRAINT "ClaimantComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "ClaimantComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantDocumentStatus" ADD CONSTRAINT "ClaimantDocumentStatus_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimantDocumentStatus" ADD CONSTRAINT "ClaimantDocumentStatus_resourceContactedId_fkey" FOREIGN KEY ("resourceContactedId") REFERENCES "DocumentResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLifecycle" ADD CONSTRAINT "ClaimLifecycle_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimMilestoneEvent" ADD CONSTRAINT "ClaimMilestoneEvent_lifecycleId_fkey" FOREIGN KEY ("lifecycleId") REFERENCES "ClaimLifecycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimQueuePosition" ADD CONSTRAINT "ClaimQueuePosition_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleNotificationPreference" ADD CONSTRAINT "LifecycleNotificationPreference_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "Claimant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_referredToFirmId_fkey" FOREIGN KEY ("referredToFirmId") REFERENCES "LawFirm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ServiceSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
