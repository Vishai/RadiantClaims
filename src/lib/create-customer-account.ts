import { db } from "./db";
import { randomBytes } from "crypto";

/**
 * Create a customer account for a claimant
 * Generates a password reset token for secure setup
 */
export async function createCustomerAccount(params: {
  email: string;
  name: string;
  claimantId: string;
}): Promise<{
  user: any;
  accountCreated: boolean;
  resetToken?: string;
  resetTokenExpires?: Date;
}> {
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
      accountCreated: false, // User already has account
    };
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create user account
  const user = await db.user.create({
    data: {
      email,
      name,
      password: null,
      role: "CUSTOMER",
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpires,
    },
  });

  // Link claimant to user
  await db.claimant.update({
    where: { id: claimantId },
    data: { userId: user.id },
  });

  return {
    user,
    accountCreated: true,
    resetToken,
    resetTokenExpires,
  };
}
