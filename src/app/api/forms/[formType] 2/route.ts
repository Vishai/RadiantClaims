import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RECAFormType } from "@prisma/client";

/**
 * GET /api/forms/[formType]
 * Returns specific form metadata and download URL
 * Example: GET /api/forms/downwinder
 */
export async function GET(
  _request: Request,
  { params }: { params: { formType: string } }
) {
  try {
    const { formType } = params;

    // Convert URL param to enum value
    const formTypeEnum = formType
      .toUpperCase()
      .replace(/-/g, "_") as RECAFormType;

    // Validate form type
    if (!Object.values(RECAFormType).includes(formTypeEnum)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid form type",
          validTypes: Object.values(RECAFormType).map((type) =>
            type.toLowerCase().replace(/_/g, "-")
          ),
        },
        { status: 400 }
      );
    }

    const form = await db.rECAForm.findFirst({
      where: {
        formType: formTypeEnum,
      },
    });

    if (!form) {
      return NextResponse.json(
        {
          success: false,
          error: "Form not found",
        },
        { status: 404 }
      );
    }

    // Add download URL to response
    const formWithDownloadUrl = {
      ...form,
      downloadUrl: `/api/forms/download/${formType}`,
    };

    return NextResponse.json({
      success: true,
      form: formWithDownloadUrl,
    });
  } catch (error) {
    console.error("Error fetching RECA form:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch RECA form",
      },
      { status: 500 }
    );
  }
}
