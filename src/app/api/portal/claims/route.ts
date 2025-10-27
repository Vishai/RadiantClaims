import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/claims
 * Get all claims for the logged-in customer
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all claimants for this user
    const claims = await db.claimant.findMany({
      where: { userId: user.id },
      include: {
        intakeSession: {
          include: {
            uploadedFiles: {
              where: { status: "READY" },
              select: {
                id: true,
                category: true,
                originalFilename: true,
                sizeBytes: true,
                uploadedAt: true,
              },
            },
            packetSubmission: true,
          },
        },
        referral: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
