import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPresignedGetUrl } from "@/lib/r2";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sourceId = params.id;

    // Fetch knowledge source to get the key
    const source = await db.knowledgeSource.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Access control:
    // 1. Admins can access all
    // 2. Attorneys can access if uploaded by them OR if linked to a claimant they have access to (TODO: robust check)
    // 3. Claimants can access if linked to their ID

    // Simplified check for now:
    if (session.user.role === "CUSTOMER") {
      // Must match claimant ID
      // Need to fetch user's claimant ID
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { claimants: true },
      });
      if (user?.claimants[0]?.id !== source.claimantId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ATTORNEY" &&
      session.user.role !== "FIRM_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate signed URL
    const url = await getPresignedGetUrl(source.fileKey);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download link" },
      { status: 500 }
    );
  }
}
