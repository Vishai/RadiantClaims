import { db } from "@/lib/db";
import { EmailType } from "@prisma/client";

/**
 * Check if a user has unsubscribed from a specific email type
 */
export async function isUnsubscribed(
  email: string,
  emailType: EmailType
): Promise<boolean> {
  const preference = await db.emailPreference.findUnique({
    where: {
      email_emailType: {
        email,
        emailType,
      },
    },
  });

  return preference?.isUnsubscribed ?? false;
}

/**
 * Get all email preferences for a user
 */
export async function getEmailPreferences(email: string) {
  const preferences = await db.emailPreference.findMany({
    where: { email },
  });

  return preferences;
}

/**
 * Generate unsubscribe URL for email templates
 */
export function generateUnsubscribeUrl(
  email: string,
  emailType?: EmailType
): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const params = new URLSearchParams({
    email,
    type: emailType || "ALL",
  });

  return `${baseUrl}/api/email/unsubscribe?${params.toString()}`;
}
