import { Resend } from "resend";
import { env } from "@/env.mjs";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  html,
  from = "RadiantClaims <noreply@radiantclaims.dev>",
}: SendEmailParams) {
  const client = getResendClient();

  if (!client) {
    console.warn("Resend API key not configured. Email not sent.");
    console.log("Email details:", { to, subject, from });
    return { success: false, message: "Resend not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
