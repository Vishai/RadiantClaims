import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const guestInfoSchema = z.object({
  token: z.string(),
  guestData: z.object({
    fullName: z.string(),
    phone: z.string(),
    address: z.string(),
    notes: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = guestInfoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.errors },
        { status: 400 }
      );
    }

    const { token, guestData } = result.data;

    // Verify token exists and is valid
    const uploadToken = await db.externalUploadToken.findUnique({
      where: { token },
    });

    if (!uploadToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (uploadToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 403 });
    }

    // Update the token with guest data
    await db.externalUploadToken.update({
      where: { token },
      data: {
        guestData: guestData,
        // We could also update recipientName if it changed
        recipientName: guestData.fullName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save guest info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
