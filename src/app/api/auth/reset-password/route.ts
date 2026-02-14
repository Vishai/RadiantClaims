import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Audit logging details
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      await createAuditLog({
        action: AuditAction.PASSWORD_RESET_COMPLETED,
        ipAddress,
        userAgent,
        metadata: { token_fragment: token.substring(0, 8) + "..." },
        success: false,
        errorMessage: "Invalid or expired token",
      });

      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    // Log success
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      ipAddress,
      userAgent,
      success: true,
    });

    // Send password changed confirmation email (fire-and-forget)
    if (user.email) {
      sendPasswordChangedEmail({
        to: user.email,
        name: user.name || "there",
      }).catch((err) =>
        console.error("Failed to send password changed email:", err)
      );
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
