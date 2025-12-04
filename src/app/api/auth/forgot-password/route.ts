import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import {
  passwordResetRateLimiter,
  createRateLimitResponse,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Rate limit by email and IP to prevent abuse
    const ipAddress = getClientIp(req);
    const rateKeyEmail = `password-reset:${email.toLowerCase()}`;
    const rateKeyIp = `password-reset-ip:${ipAddress}`;

    const [emailLimit, ipLimit] = await Promise.all([
      passwordResetRateLimiter.limit(rateKeyEmail),
      passwordResetRateLimiter.limit(rateKeyIp),
    ]);

    if (!emailLimit.success || !ipLimit.success) {
      return createRateLimitResponse(
        !emailLimit.success ? emailLimit : ipLimit
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Audit logging details
    const userAgent = getUserAgent(req);

    if (!user) {
      // Log failed attempt (security)
      await createAuditLog({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        ipAddress,
        userAgent,
        metadata: { email, result: "user_not_found" },
        success: false,
        errorMessage: "User not found",
      });

      // Return success to prevent email enumeration
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires,
      },
    });

    // Send email
    await sendPasswordResetEmail({
      to: user.email!,
      name: user.name || "User",
      resetToken,
      expiresAt: passwordResetExpires,
    });

    // Log success
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      ipAddress,
      userAgent,
      metadata: { email },
      success: true,
    });

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
