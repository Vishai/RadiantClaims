import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, accessCode } = body;
    const normalizedAccessCode =
      typeof accessCode === "string" ? accessCode.trim().toUpperCase() : null;

    // Check if registration is enabled or if we have an override code
    const registrationEnabled = process.env.REGISTRATION_ENABLED !== "false";
    let accessOverridePromo: {
      id: string;
      code: string;
      accessSeatsTotal: number | null;
      accessSeatsUsed: number;
      expiresAt: Date | null;
    } | null = null;

    if (!registrationEnabled) {
      if (!normalizedAccessCode) {
        return NextResponse.json(
          {
            error: "Registration is temporarily disabled",
            message:
              "We're currently not accepting new registrations while we finalize our workflows. Use your invite code or check back soon.",
          },
          { status: 503 }
        );
      }
    }

    if (normalizedAccessCode) {
      const promo = await db.promoCode.findFirst({
        where: {
          code: normalizedAccessCode,
          accessOverrideEnabled: true,
          isActive: true,
          isArchived: false,
        },
        select: {
          id: true,
          code: true,
          accessSeatsTotal: true,
          accessSeatsUsed: true,
          expiresAt: true,
        },
      });

      if (!promo) {
        return NextResponse.json(
          {
            error: "Invalid access code",
            message:
              "That invite code could not be found or has been disabled. Please contact support for a new code.",
          },
          { status: 403 }
        );
      }

      if (promo.expiresAt && promo.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "This access code has expired" },
          { status: 410 }
        );
      }

      if (
        promo.accessSeatsTotal !== null &&
        promo.accessSeatsUsed >= promo.accessSeatsTotal
      ) {
        return NextResponse.json(
          { error: "This access code has reached its seat limit" },
          { status: 409 }
        );
      }

      accessOverridePromo = promo;
    }

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (and record access grant if applicable)
    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name || null,
          role: "CUSTOMER", // Default role for new signups
        },
      });

      if (accessOverridePromo) {
        await tx.promoCode.update({
          where: { id: accessOverridePromo.id },
          data: {
            accessSeatsUsed: { increment: 1 },
            accessGrants: {
              create: {
                email: email.toLowerCase(),
                userId: createdUser.id,
              },
            },
          },
        });
      }

      return createdUser;
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: "USER_CREATED",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || undefined,
      metadata: {
        email: user.email,
        registrationMethod: "credentials",
        accessCodeUsed: accessOverridePromo?.code ?? null,
      },
    });

    // Return success (don't include password in response)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
