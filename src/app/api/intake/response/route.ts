import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const saveResponseSchema = z.object({
  intakeSessionId: z.string(),
  questionKey: z.string(),
  questionText: z.string(),
  answerValue: z.string(), // JSON string for complex answers
});

/**
 * POST /api/intake/response
 * Save or update an intake question response
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intakeSessionId, questionKey, questionText, answerValue } =
      saveResponseSchema.parse(body);

    // Verify session exists
    const session = await db.intakeSession.findUnique({
      where: { id: intakeSessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 403 }
      );
    }

    // Upsert response (update if exists, create if not)
    const response = await db.intakeResponse.upsert({
      where: {
        intakeSessionId_questionKey: {
          intakeSessionId,
          questionKey,
        },
      },
      create: {
        intakeSessionId,
        questionKey,
        questionText,
        answerValue,
      },
      update: {
        answerValue,
        questionText,
      },
    });

    // Update session last activity
    await db.intakeSession.update({
      where: { id: intakeSessionId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Response save error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 }
    );
  }
}
