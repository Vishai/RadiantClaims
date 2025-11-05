/**
 * POST /api/validation/session
 *
 * Validates all documents in an intake session.
 * Runs validation for all uploaded files in parallel.
 * Optionally runs the full pipeline including data extraction and completeness check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateSession,
  runFullValidation,
} from '@/lib/ai-agents/orchestration-service';
import { getServerAuthSession } from '@/lib/auth';
import { canAccessSession } from '@/lib/auth/permissions';

const validateSessionSchema = z.object({
  intakeSessionId: z.string().min(1, 'intakeSessionId is required'),
  runFullPipeline: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { intakeSessionId, runFullPipeline } = validateSessionSchema.parse(body);

    // Check if user can access this session
    const hasAccess = await canAccessSession(session.user.id, intakeSessionId);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - You do not have access to this session',
        },
        { status: 403 }
      );
    }

    if (runFullPipeline) {
      // Run the complete validation pipeline (all 3 phases)
      const result = await runFullValidation(intakeSessionId);

      return NextResponse.json({
        success: true,
        intakeSessionId,
        mode: 'full_pipeline',
        documentsValidated: result.documentsValidated,
        documentsFailed: result.documentsFailed,
        dataExtracted: result.dataExtracted,
        readinessScore: result.readinessScore,
        isReadyForSubmission: result.isReadyForSubmission,
        message: 'Full validation pipeline completed successfully',
      });
    } else {
      // Run only document validation (Phase 1)
      const result = await validateSession(intakeSessionId);

      return NextResponse.json({
        success: true,
        intakeSessionId,
        mode: 'documents_only',
        totalDocuments: result.totalDocuments,
        validated: result.validated,
        failed: result.failed,
        results: result.results,
        message: 'Session documents validated successfully',
      });
    }
  } catch (error) {
    console.error('Session validation API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
