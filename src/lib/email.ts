import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome";
import ResumeLinkEmail from "@/emails/resume-link";
import UploadConfirmationEmail from "@/emails/upload-confirmation";
import PacketReadyEmail from "@/emails/packet-ready";
import ResourceFollowUpEmail from "@/emails/client/resource-follow-up";
import ResourceAlternativesEmail from "@/emails/client/resource-alternatives";
import ResourceSuccessEmail from "@/emails/client/resource-success";
import { EmailType } from "@prisma/client";
import {
  isUnsubscribed,
  generateUnsubscribeUrl,
} from "@/lib/email-preferences";

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
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.UPLOAD_CONFIRMATION
    );
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
  const {
    to,
    name,
    claimType = "RECA Claim",
    documentCount,
    packetUrl,
  } = params;

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

/**
 * Send resource follow-up email (first stage - 3-7 days)
 */
export async function sendResourceFollowUpEmail(params: {
  to: string;
  claimantName?: string;
  officeName: string;
  officeType: string;
  documentType: string;
  searchQuery?: string;
  feedbackUrl: string;
  alternativesUrl?: string;
}) {
  const {
    to,
    claimantName,
    officeName,
    officeType,
    documentType,
    searchQuery,
    feedbackUrl,
    alternativesUrl,
  } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.RESOURCE_FOLLOW_UP);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from RESOURCE_FOLLOW_UP emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const emailHtml = await render(
      ResourceFollowUpEmail({
        claimantName,
        officeName,
        officeType,
        documentType,
        searchQuery,
        feedbackUrl,
        alternativesUrl,
        portalUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.RESOURCE_FOLLOW_UP
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `How did it go with ${officeName}?`,
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send resource follow-up email:", error);
      throw new Error(
        `Failed to send resource follow-up email: ${error.message}`
      );
    }

    console.log("Resource follow-up email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending resource follow-up email:", error);
    throw error;
  }
}

/**
 * Send resource alternatives email (second stage - 10 days)
 */
export async function sendResourceAlternativesEmail(params: {
  to: string;
  claimantName?: string;
  officeName: string;
  documentType: string;
  alternativeResources?: Array<{
    name: string;
    type: string;
    phone?: string;
  }>;
  feedbackUrl: string;
  chatUrl?: string;
}) {
  const {
    to,
    claimantName,
    officeName,
    documentType,
    alternativeResources,
    feedbackUrl,
    chatUrl,
  } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.RESOURCE_ALTERNATIVES
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from RESOURCE_ALTERNATIVES emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const emailHtml = await render(
      ResourceAlternativesEmail({
        claimantName,
        officeName,
        documentType,
        alternativeResources,
        feedbackUrl,
        chatUrl,
        portalUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.RESOURCE_ALTERNATIVES
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Still need help getting your ${documentType}?`,
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send resource alternatives email:", error);
      throw new Error(
        `Failed to send resource alternatives email: ${error.message}`
      );
    }

    console.log("Resource alternatives email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending resource alternatives email:", error);
    throw error;
  }
}

/**
 * Send resource success email (after positive feedback)
 */
export async function sendResourceSuccessEmail(params: {
  to: string;
  claimantName?: string;
  officeName: string;
  documentType: string;
  uploadUrl: string;
}) {
  const { to, claimantName, officeName, documentType, uploadUrl } = params;

  // Check if user has unsubscribed
  const unsubscribed = await isUnsubscribed(to, EmailType.RESOURCE_SUCCESS);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from RESOURCE_SUCCESS emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const emailHtml = await render(
      ResourceSuccessEmail({
        claimantName,
        officeName,
        documentType,
        uploadUrl,
        portalUrl,
      }),
      { pretty: true }
    );

    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.RESOURCE_SUCCESS
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `🎉 You got your ${documentType}! Now upload it`,
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send resource success email:", error);
      throw new Error(
        `Failed to send resource success email: ${error.message}`
      );
    }

    console.log("Resource success email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending resource success email:", error);
    throw error;
  }
}
