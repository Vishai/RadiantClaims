/**
 * RECA PDF Generation API Endpoint
 * Generates a comprehensive PDF package for RECA claims
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateRECAPDF } from '@/lib/reca/pdf-generator';

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (intakeSession.claimant?.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = intakeSession.recaFormData as any;
    const supportingForms = intakeSession.recaSupportingForms as any;

    if (!formData) {
      return NextResponse.json(
        { error: 'No form data found' },
        { status: 400 }
      );
    }

    // Generate the data summary PDF
    const pdfBytes = await generateRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
    });

    // Return PDF with appropriate headers
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RECA-Data-Summary-${params.sessionId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating RECA PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate complete document package (ZIP file)
 * POST /api/reca/pdf/[sessionId]?package=true
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const generatePackage = searchParams.get('package') === 'true';

    if (!generatePackage) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workflow state from database
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: params.sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (intakeSession.claimant?.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // For now, just return the data summary PDF
    // In the future, this can be expanded to create a ZIP package with:
    // - Data summary PDF
    // - Official blank form PDF
    // - Instructions PDF
    // - Document checklist

    const formData = intakeSession.recaFormData as any;
    const supportingForms = intakeSession.recaSupportingForms as any;

    const pdfBytes = await generateRECAPDF({
      formData,
      supportingForms: supportingForms || {},
      sessionId: params.sessionId,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="RECA-Complete-Package-${params.sessionId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error generating RECA package:', error);
    return NextResponse.json(
      { error: 'Failed to generate package', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
