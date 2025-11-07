import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    // Get all files for this session
    const files = await prisma.uploadedFile.findMany({
      where: { intakeSessionId: sessionId },
      include: {
        validation: {
          select: {
            status: true,
            overallConfidence: true,
            criticalIssues: true,
            warnings: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching session documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
