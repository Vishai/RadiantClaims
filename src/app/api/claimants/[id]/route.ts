import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimant = await db.claimant.findUnique({
      where: { id: params.id },
      include: {
        referral: true,
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!claimant) {
      return NextResponse.json(
        { error: "Claimant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(claimant);
  } catch (error) {
    console.error("Failed to fetch claimant:", error);
    return NextResponse.json(
      { error: "Failed to fetch claimant" },
      { status: 500 }
    );
  }
}
