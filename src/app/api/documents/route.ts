import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const documentSchema = z.object({
  claimantId: z.string(),
  type: z.enum(["ID", "Medical", "ProofOfResidency", "Other"]),
  fileKey: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = documentSchema.parse(body);

    const document = await db.document.create({
      data: validated,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
