import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const categorizeSchema = z.object({
  category: z.enum([
    "IDENTITY",
    "PROOF_OF_RESIDENCE",
    "PATHOLOGY_REPORT",
    "MEDICAL_RECORDS",
    "DISCHARGE_SUMMARY",
    "TUMOR_REGISTRY",
    "TREATMENT_RECORDS",
    "UTILITY_BILL",
    "MORTGAGE_STATEMENT",
    "TAX_RETURN",
    "SCHOOL_RECORDS",
    "EMPLOYMENT_RECORDS",
    "OTHER",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { category } = categorizeSchema.parse(body);

    // Update the file category
    const updatedFile = await db.uploadedFile.update({
      where: { id },
      data: { category },
    });

    return NextResponse.json(
      {
        success: true,
        file: updatedFile,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid category", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Categorize error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
