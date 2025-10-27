import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/forms
 * Returns list of available RECA forms with metadata
 */
export async function GET() {
  try {
    const forms = await db.rECAForm.findMany({
      orderBy: {
        formType: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      forms,
    });
  } catch (error) {
    console.error("Error fetching RECA forms:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch RECA forms",
      },
      { status: 500 }
    );
  }
}
