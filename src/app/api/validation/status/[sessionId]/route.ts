/**
 * GET /api/validation/status/[sessionId]
 *
 * Retrieves the current validation status for an intake session.
 * Returns progress information including document counts, data extraction status,
 * and completeness check results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getValidationStatus } from '@/lib/ai-agents/orchestration-service';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required',
        },
        { status: 400 }
      );
    }

    // Get validation status
    const status = await getValidationStatus(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      status: {
        documents: {
          total: status.totalDocuments,
          completed: status.completed,
          processing: status.processing,
          failed: status.failed,
          pending: status.pending,
        },
        dataExtraction: {
          completed: status.dataExtracted,
        },
        completenessCheck: {
          completed: status.completenessChecked,
          readinessScore: status.readinessScore,
        },
        progress: {
          documentsPercent: status.totalDocuments > 0
            ? Math.round((status.completed / status.totalDocuments) * 100)
            : 0,
          overallStatus: getOverallStatus(status),
        },
      },
    });
  } catch (error) {
    console.error('Validation status API error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
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

/**
 * Determine overall validation status based on progress
 */
function getOverallStatus(status: {
  totalDocuments: number;
  completed: number;
  processing: number;
  failed: number;
  pending: number;
  dataExtracted: boolean;
  completenessChecked: boolean;
}): 'not_started' | 'in_progress' | 'completed' | 'failed' | 'partial' {
  if (status.totalDocuments === 0) {
    return 'not_started';
  }

  if (status.failed > 0 && status.completed === 0) {
    return 'failed';
  }

  if (status.processing > 0 || status.pending > 0) {
    return 'in_progress';
  }

  if (status.completed === status.totalDocuments && status.dataExtracted && status.completenessChecked) {
    return 'completed';
  }

  if (status.completed > 0) {
    return 'partial';
  }

  return 'not_started';
}
