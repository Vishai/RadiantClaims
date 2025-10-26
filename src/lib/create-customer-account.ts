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
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  temporaryPassword: string;
  claimantId: string;
  resumeToken?: string;
}) {
  // TODO: Implement with Resend
  // For now, just log
  console.log("Welcome email would be sent to:", {
    to: params.email,
    subject: "Welcome to RadiantClaims - Your Account is Ready",
    body: `
      Hi ${params.name},

      Your RadiantClaims account has been created!

      Email: ${params.email}
      Temporary Password: ${params.temporaryPassword}

      Login at: ${process.env.NEXTAUTH_URL}/login

      ${params.resumeToken ? `Resume your claim: ${process.env.NEXTAUTH_URL}/intake/step2?token=${params.resumeToken}` : ""}

      Please change your password after logging in.

      - The RadiantClaims Team
    `,
  });

  // Return the credentials for now (remove in production)
  return {
    email: params.email,
    temporaryPassword: params.temporaryPassword,
  };
}
