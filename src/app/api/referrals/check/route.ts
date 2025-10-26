import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const checkSchema = z.object({
  code: z.string().min(1, "Referral code is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = checkSchema.parse(body);

    const referral = await db.referral.findUnique({
      where: { code },
    });

    if (!referral) {
      return NextResponse.json(
        { valid: false, message: "Referral code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      referral: {
        code: referral.code,
        referrerName: referral.referrerName,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to check referral code" },
      { status: 500 }
    );
  }
}
