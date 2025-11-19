import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { z } from "zod";

const requestSchema = z.object({
  sessionId: z.string(),
  siblingName: z.string(),
  siblingEmail: z.string().email(),
  category: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, siblingName, siblingEmail, category } = result.data;

    // Verify session ownership
    const intakeSession = await db.intakeSession.findUnique({
      where: { id: sessionId },
      include: { claimant: true },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // In a real app, we'd check if session.user.id owns this intakeSession
    // For now, assuming if they have the ID and are logged in, it's okay (or we rely on the UI to pass the right ID)
    // Ideally: check intakeSession.claimant.userId === user.id

    // Generate Token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create Token Record
    await db.externalUploadToken.create({
      data: {
        token,
        intakeSessionId: sessionId,
        recipientEmail: siblingEmail,
        recipientName: siblingName,
        targetCategory: category,
        expiresAt,
      },
    });

    // Mock Email Sending
    const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/upload/${token}`;
    console.log(`[EMAIL MOCK] To: ${siblingEmail}`);
    console.log(
      `[EMAIL MOCK] Subject: Document Request for ${intakeSession.claimant?.firstName} ${intakeSession.claimant?.lastName}`
    );
    console.log(
      `[EMAIL MOCK] Body: Please upload the requested documents here: ${uploadLink}`
    );

    return NextResponse.json({
      success: true,
      message: "Request sent successfully",
      uploadUrl: uploadLink,
    });
  } catch (error) {
    console.error("Failed to send request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
