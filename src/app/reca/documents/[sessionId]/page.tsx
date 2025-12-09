/**
 * RECA Document Dashboard
 *
 * Central hub for managing all documents required for a RECA claim.
 * Integrates:
 * - Dynamic document requirements (from form data analysis)
 * - Document upload and management
 * - Document validation and review
 * - Progress tracking
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { RECADocumentDashboard } from '@/components/reca/RECADocumentDashboard';
import prisma from '@/lib/prisma';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    sessionId: string;
  };
}

async function getWorkflowData(sessionId: string) {
  // Fetch the RECA workflow session
  const workflow = await prisma.rECAWorkflowSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      currentSection: true,
      currentStage: true,
      completionPercentage: true,
      formData: true,
      supportingForms: true,
      eligibilityData: true,
      status: true,
      intakeSessionId: true,
    },
  });

  if (!workflow) {
    return null;
  }

  // Fetch all uploaded files for this session
  const uploadedFiles = await prisma.uploadedFile.findMany({
    where: {
      intakeSessionId: workflow.intakeSessionId,
    },
    select: {
      id: true,
      fileKey: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      category: true,
      status: true,
      customerStatus: true,
      thumbnailKey: true,
      uploadedAt: true,
      isRequired: true,
      requiresOriginal: true,
      rejectionReason: true,
      categoryLocked: true,
      ocrConfidence: true,
      ocrText: true,
      metadata: true,
      userNotes: true,
      userConfirmed: true,
      validation: {
        select: {
          status: true,
          category: true,
          confidence: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  return {
    workflow,
    uploadedFiles,
  };
}

export default async function RECADocumentsPage({ params }: PageProps) {
  const { sessionId } = params;
  const data = await getWorkflowData(sessionId);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-terracotta-500" />
          </div>
        }
      >
        <RECADocumentDashboard
          sessionId={sessionId}
          intakeSessionId={data.workflow.intakeSessionId}
          formData={data.workflow.formData as any}
          uploadedFiles={data.uploadedFiles as any}
          completionPercentage={data.workflow.completionPercentage}
        />
      </Suspense>
    </div>
  );
}
