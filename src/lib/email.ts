import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome";
import ResumeLinkEmail from "@/emails/resume-link";
import UploadConfirmationEmail from "@/emails/upload-confirmation";
import PacketReadyEmail from "@/emails/packet-ready";
import { EmailType } from "@prisma/client";
import { isUnsubscribed, generateUnsubscribeUrl } from "@/lib/email-preferences";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender
const DEFAULT_FROM = "RadiantClaims <noreply@radiantclaims.com>";

// Base URL for links
const getBaseUrl = () => {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};

/**
 * Send welcome email with login credentials
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
  claimantId?: string;
  resumeToken?: string;
}) {
  const { to, name, email, temporaryPassword, resumeToken } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.WELCOME);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from WELCOME emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/login`;
  const resumeUrl = resumeToken
    ? `${baseUrl}/intake/step2?token=${resumeToken}`
    : undefined;

  try {
    const emailHtml = await render(
      WelcomeEmail({
        name,
        email,
        temporaryPassword,
        loginUrl,
        resumeUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.WELCOME);
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Welcome to RadiantClaims - Your Account is Ready",
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log("Welcome email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

/**
 * Send resume link email (save for later)
 */
export async function sendResumeLinkEmail(params: {
  to: string;
  name: string;
  resumeToken: string;
  currentStep?: string;
  uploadedDocuments?: number;
  expiresAt?: Date;
}) {
  const {
    to,
    name,
    resumeToken,
    currentStep = "Document Upload",
    uploadedDocuments = 0,
    expiresAt,
  } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.RESUME_LINK);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from RESUME_LINK emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const resumeUrl = `${baseUrl}/intake/step2?token=${resumeToken}`;

  // Calculate expiration display text
  let expiresText = "7 days";
  if (expiresAt) {
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expiresText = `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`;
  }

  try {
    const emailHtml = await render(
      ResumeLinkEmail({
        name,
        resumeUrl,
        currentStep,
        uploadedDocuments,
        expiresAt: expiresText,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.RESUME_LINK);
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Resume Your RECA Claim - RadiantClaims",
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send resume link email:", error);
      throw new Error(`Failed to send resume link email: ${error.message}`);
    }

    console.log("Resume link email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending resume link email:", error);
    throw error;
  }
}

/**
 * Send upload confirmation email
 */
export async function sendUploadConfirmationEmail(params: {
  to: string;
  name: string;
  documentType: string;
  documentCount?: number;
  totalUploaded: number;
  resumeToken: string;
}) {
  const {
    to,
    name,
    documentType,
    documentCount = 1,
    totalUploaded,
    resumeToken,
  } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.UPLOAD_CONFIRMATION);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from UPLOAD_CONFIRMATION emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const resumeUrl = `${baseUrl}/intake/step2?token=${resumeToken}`;

  try {
    const emailHtml = await render(
      UploadConfirmationEmail({
        name,
        documentType,
        documentCount,
        totalUploaded,
        resumeUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.UPLOAD_CONFIRMATION);
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Document Received - ${documentType}`,
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send upload confirmation email:", error);
      throw new Error(
        `Failed to send upload confirmation email: ${error.message}`
      );
    }

    console.log("Upload confirmation email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending upload confirmation email:", error);
    throw error;
  }
}

/**
 * Send packet ready notification email
 */
export async function sendPacketReadyEmail(params: {
  to: string;
  name: string;
  claimType?: string;
  documentCount: number;
  packetUrl?: string;
}) {
  const { to, name, claimType = "RECA Claim", documentCount, packetUrl } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.PACKET_READY);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from PACKET_READY emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const emailHtml = await render(
      PacketReadyEmail({
        name,
        claimType,
        documentCount,
        packetUrl,
        portalUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.PACKET_READY);
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Your RECA Claim Packet is Ready for Review",
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send packet ready email:", error);
      throw new Error(`Failed to send packet ready email: ${error.message}`);
    }

    console.log("Packet ready email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending packet ready email:", error);
    throw error;
  }
}
