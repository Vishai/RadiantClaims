import { db } from "./db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/**
 * Create a customer account for a claimant
 * Generates a random password and returns it (to be emailed)
 */
export async function createCustomerAccount(params: {
  email: string;
  name: string;
  claimantId: string;
}): Promise<{ user: any; temporaryPassword: string }> {
  const { email, name, claimantId } = params;

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Link claimant to existing user
    await db.claimant.update({
      where: { id: claimantId },
      data: { userId: existingUser.id },
    });

    return {
      user: existingUser,
      temporaryPassword: "", // User already has account
    };
  }

  // Generate temporary password (12 characters, alphanumeric)
  const temporaryPassword = randomBytes(8).toString("base64").slice(0, 12);

  // Hash password
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  // Create user account
  const user = await db.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  // Link claimant to user
  await db.claimant.update({
    where: { id: claimantId },
    data: { userId: user.id },
  });

  return {
    user,
    temporaryPassword,
  };
}

/**
 * Send welcome email with login credentials
 * @deprecated Use sendWelcomeEmail from @/lib/email instead
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  temporaryPassword: string;
  claimantId: string;
  resumeToken?: string;
}) {
  // Import the email module
  const { sendWelcomeEmail: sendWelcomeEmailImpl } = await import("@/lib/email");

  // Send the email using Resend
  try {
    await sendWelcomeEmailImpl({
      to: params.email,
      name: params.name,
      email: params.email,
      temporaryPassword: params.temporaryPassword,
      claimantId: params.claimantId,
      resumeToken: params.resumeToken,
    });

    return {
      email: params.email,
      temporaryPassword: params.temporaryPassword,
    };
  } catch (error) {
    // Log error but don't throw - email failure shouldn't block account creation
    console.error("Failed to send welcome email:", error);

    // Fallback: log credentials (for development)
    console.log("Welcome email failed - credentials:", {
      to: params.email,
      temporaryPassword: params.temporaryPassword,
    });

    return {
      email: params.email,
      temporaryPassword: params.temporaryPassword,
    };
  }
}
