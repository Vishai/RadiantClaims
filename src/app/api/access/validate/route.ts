import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    const promoCode = await db.promoCode.findFirst({
      where: {
        code: normalizedCode,
        accessOverrideEnabled: true,
        isActive: true,
        isArchived: false,
      },
      select: {
        id: true,
        code: true,
        description: true,
        expiresAt: true,
        accessSeatsTotal: true,
        accessSeatsUsed: true,
      },
    });

    if (!promoCode) {
      return NextResponse.json(
        { error: "Invalid or inactive access code" },
        { status: 404 }
      );
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This access code has expired" },
        { status: 410 }
      );
    }

    const seatsTotal = promoCode.accessSeatsTotal;
    const seatsRemaining =
      seatsTotal === null
        ? null
        : Math.max(seatsTotal - promoCode.accessSeatsUsed, 0);

    if (seatsTotal !== null && seatsRemaining !== null && seatsRemaining <= 0) {
      return NextResponse.json(
        { error: "This access code has reached its seat limit" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      code: promoCode.code,
      description: promoCode.description,
      seatsTotal,
      seatsRemaining,
      expiresAt: promoCode.expiresAt,
    });
  } catch (error) {
    console.error("Access code validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to validate access code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
