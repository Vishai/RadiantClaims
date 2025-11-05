import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { validatePassword } from "@/lib/auth/password-policy";

export async function POST(request: Request) {
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
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(", ") },
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
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "CUSTOMER",
        passwordChangedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
