/**
 * POST /api/validation/document
 *
 * Validates a single uploaded document using the AI validation pipeline.
 * Runs the classifier agent and appropriate validation agent based on document category.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateDocument } from '@/lib/ai-agents/orchestration-service';
import { getServerAuthSession } from '@/lib/auth';
import { canAccessDocument } from '@/lib/auth/permissions';

const validateDocumentSchema = z.object({
  uploadedFileId: z.string().min(1, 'uploadedFileId is required'),
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
    const { uploadedFileId } = validateDocumentSchema.parse(body);

    // Check if user can access this document
    const hasAccess = await canAccessDocument(session.user.id, uploadedFileId);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - You do not have access to this document',
        },
        { status: 403 }
      );
    }

    // Run validation
    const result = await validateDocument(uploadedFileId);

    if (result.status === 'FAILED') {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Validation failed',
          uploadedFileId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadedFileId: result.uploadedFileId,
      category: result.category,
      message: 'Document validation completed successfully',
    });
  } catch (error) {
    console.error('Document validation API error:', error);

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
