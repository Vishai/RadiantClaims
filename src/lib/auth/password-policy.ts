import { db } from "@/lib/db";

export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  maxAge: 90, // days - require change every 90 days
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength?: "weak" | "medium" | "strong";
}

/**
 * Validate password against security policy
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_RULES.minLength} characters`,
    );
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    PASSWORD_RULES.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  // Common passwords check
  const commonPasswords = [
    "password",
    "password123",
    "admin",
    "qwerty",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "sunshine",
    "123456",
    "12345678",
    "111111",
    "radiant",
    "claims",
  ];

  if (
    PASSWORD_RULES.preventCommonPasswords &&
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    errors.push("Password is too common");
  }

  // Calculate strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (errors.length === 0) {
    if (password.length >= 16) {
      strength = "strong";
    } else if (password.length >= 12) {
      strength = "medium";
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Mark a user's password as requiring change
 */
export async function requirePasswordChange(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { passwordResetRequired: true },
  });
}

/**
 * Check if a user's password has expired
 */
export async function isPasswordExpired(user: {
  passwordChangedAt: Date | null;
}): Promise<boolean> {
  if (!user.passwordChangedAt) return true; // Never changed

  const daysSinceChange = Math.floor(
    (Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysSinceChange > PASSWORD_RULES.maxAge;
}

/**
 * Update password and reset flags
 */
export async function updatePassword(
  userId: string,
  hashedPassword: string,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      passwordResetRequired: false,
    },
  });
}

/**
 * Generate a secure password reset token
 */
export async function generatePasswordResetToken(
  userId: string,
): Promise<string> {
  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string) {
  const user = await db.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  return user;
}

/**
 * Clear password reset token after use
 */
export async function clearPasswordResetToken(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
