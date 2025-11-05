import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // Check if registration is enabled
    const registrationEnabled = process.env.REGISTRATION_ENABLED !== "false";
    if (!registrationEnabled) {
      return NextResponse.json(
        {
          error: "Registration is temporarily disabled",
          message:
            "We're currently not accepting new registrations while we finalize our terms of service and workflows. Please check back soon!",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

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

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
        role: "CUSTOMER", // Default role for new signups
      },
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
