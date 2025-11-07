import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validations = await prisma.documentValidation.findMany({
      select: {
        id: true,
        status: true,
        overallConfidence: true,
        processingStartedAt: true,
        processingCompletedAt: true,
        reviewedBy: true,
        reviewedAt: true,
        staffNotes: true,
        criticalIssues: true,
        warnings: true,
        suggestions: true,
        uploadedFile: {
          select: {
            id: true,
            originalFilename: true,
            category: true,
            customerStatus: true,
            intakeSession: {
              select: {
                id: true,
                claimant: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    user: {
                      select: {
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
                serviceSubscription: {
                  select: {
                    user: {
                      select: {
                        email: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        {
          status: "asc", // NEEDS_REVIEW first
        },
        {
          processingCompletedAt: "desc",
        },
      ],
      take: 500,
    });

    return NextResponse.json({ validations });
  } catch (error) {
    console.error("Error fetching AI validations:", error);
    return NextResponse.json(
      { error: "Failed to fetch validations" },
      { status: 500 }
    );
  }
}
