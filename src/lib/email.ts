import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/welcome";
import ResumeLinkEmail from "@/emails/resume-link";
import UploadConfirmationEmail from "@/emails/upload-confirmation";
import PacketReadyEmail from "@/emails/packet-ready";
import ResourceFollowUpEmail from "@/emails/client/resource-follow-up";
import ResourceAlternativesEmail from "@/emails/client/resource-alternatives";
import ResourceSuccessEmail from "@/emails/client/resource-success";
import PasswordResetEmail from "@/emails/password-reset";
import WaitlistConfirmationEmail from "@/emails/waitlist-confirmation";
import PaymentConfirmationEmail from "@/emails/payment-confirmation";
import PaymentFailedEmail from "@/emails/payment-failed";
import IntakeStartedEmail from "@/emails/intake-started";
import { ClientProgressMilestoneEmail } from "@/emails/client/progress-milestone";
import type { MilestoneData } from "@/emails/client/progress-milestone";
import PasswordChangedEmail from "@/emails/password-changed";
import DocumentValidatedEmail from "@/emails/document-validated";
import { AttorneyNewClientNotification } from "@/emails/attorney/new-client-notification";
import type {
  ClaimantSummary,
  ClaimOverview,
} from "@/emails/attorney/new-client-notification";
import { ClientDocumentFollowUpEmail } from "@/emails/client/document-follow-up";
import type { DocumentReminder } from "@/emails/client/document-follow-up";
import { ClientReengagementEmail } from "@/emails/client/re-engagement";
import { AttorneyActivitySummaryEmail } from "@/emails/attorney/activity-summary";
import type {
  SummaryMetrics,
  ActivityItem,
} from "@/emails/attorney/activity-summary";
import FirmOnboardingEmail from "@/emails/firm-onboarding";
import AttorneyWelcomeEmail from "@/emails/attorney-welcome";
import { FinancialEdCelebrationEmail } from "@/emails/client/financial-ed-celebration";
import { FinancialEdCalculatorEmail } from "@/emails/client/financial-ed-calculator";
import { FinancialEdTipsEmail } from "@/emails/client/financial-ed-tips";
import { FinancialEdAdvisorEmail } from "@/emails/client/financial-ed-advisor";
import DailyDojPostDraftEmail from "@/emails/daily-doj-post-draft";
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

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetToken: string;
  expiresAt: Date;
}) {
  const { to, name, resetToken, expiresAt } = params;

  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  // Calculate expiration text
  const minutesUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60)
  );
  const expiresText = `${minutesUntilExpiry} minute${
    minutesUntilExpiry !== 1 ? "s" : ""
  }`;

  try {
    const emailHtml = await render(
      PasswordResetEmail({
        name,
        resetUrl,
        expiresText,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Reset Your RadiantClaims Password",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    console.log("Password reset email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

/**
 * Send waitlist confirmation email
 */
export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  name?: string;
}) {
  const { to, name } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.WAITLIST_CONFIRMATION
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from WAITLIST_CONFIRMATION emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.WAITLIST_CONFIRMATION
    );
    const emailHtml = await render(
      WaitlistConfirmationEmail({
        name,
        email: to,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "You're on the RadiantClaims Waitlist",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send waitlist confirmation email:", error);
      throw new Error(
        `Failed to send waitlist confirmation email: ${error.message}`
      );
    }

    console.log("Waitlist confirmation email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending waitlist confirmation email:", error);
    throw error;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(params: {
  to: string;
  name?: string;
  amount: number;
  paymentType: string;
  planDescription: string;
}) {
  const { to, name, amount, paymentType, planDescription } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.PAYMENT_CONFIRMATION);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from PAYMENT_CONFIRMATION emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.PAYMENT_CONFIRMATION
    );
    const emailHtml = await render(
      PaymentConfirmationEmail({
        name: name || "there",
        amount: `$${amount.toFixed(2)}`,
        paymentType,
        planDescription,
        portalUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Payment Confirmed — $${amount.toFixed(2)}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send payment confirmation email:", error);
      throw new Error(
        `Failed to send payment confirmation email: ${error.message}`
      );
    }

    console.log("Payment confirmation email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    throw error;
  }
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedEmail(params: {
  to: string;
  name?: string;
  amount: number;
  failureReason?: string;
}) {
  const { to, name, amount, failureReason } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.PAYMENT_FAILED);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from PAYMENT_FAILED emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.PAYMENT_FAILED);
    const emailHtml = await render(
      PaymentFailedEmail({
        name: name || "there",
        amount: `$${amount.toFixed(2)}`,
        failureReason: failureReason || "Your payment method was declined",
        portalUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Action Needed — Payment Unsuccessful",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send payment failed email:", error);
      throw new Error(`Failed to send payment failed email: ${error.message}`);
    }

    console.log("Payment failed email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    throw error;
  }
}

/**
 * Send intake session started confirmation email
 */
export async function sendIntakeStartedEmail(params: {
  to: string;
  name?: string;
  sessionId: string;
}) {
  const { to, name, sessionId } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.INTAKE_STARTED);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from INTAKE_STARTED emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(to, EmailType.INTAKE_STARTED);
    const emailHtml = await render(
      IntakeStartedEmail({
        name: name || "there",
        sessionId,
        portalUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Your RECA Claim Preparation Has Started",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send intake started email:", error);
      throw new Error(`Failed to send intake started email: ${error.message}`);
    }

    console.log("Intake started email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending intake started email:", error);
    throw error;
  }
}

/**
 * Send progress milestone email
 */
export async function sendProgressMilestoneEmail(params: {
  to: string;
  name?: string;
  milestone: MilestoneData;
}) {
  const { to, name, milestone } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.CLIENT_PROGRESS_MILESTONE
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from CLIENT_PROGRESS_MILESTONE emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.CLIENT_PROGRESS_MILESTONE
    );
    const emailHtml = await render(
      ClientProgressMilestoneEmail({
        claimantName: name,
        milestone,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Milestone: ${milestone.milestoneTitle}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send progress milestone email:", error);
      throw new Error(
        `Failed to send progress milestone email: ${error.message}`
      );
    }

    console.log("Progress milestone email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending progress milestone email:", error);
    throw error;
  }
}

/**
 * Send password changed confirmation email
 * Does NOT check unsubscribe — security emails always send
 */
export async function sendPasswordChangedEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;

  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/login`;

  try {
    const emailHtml = await render(
      PasswordChangedEmail({
        name,
        timestamp: new Date().toLocaleString("en-US", {
          timeZone: "America/Denver",
        }),
        loginUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Your RadiantClaims Password Has Been Changed",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send password changed email:", error);
      throw new Error(
        `Failed to send password changed email: ${error.message}`
      );
    }

    console.log("Password changed email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending password changed email:", error);
    throw error;
  }
}

/**
 * Send document validated notification email
 */
export async function sendDocumentValidatedEmail(params: {
  to: string;
  name: string;
  resumeToken?: string;
}) {
  const { to, name, resumeToken } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.DOCUMENT_VALIDATED);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from DOCUMENT_VALIDATED emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const resumeUrl = resumeToken
    ? `${baseUrl}/intake/step2?token=${resumeToken}`
    : `${baseUrl}/portal`;

  try {
    const emailHtml = await render(
      DocumentValidatedEmail({
        name,
        resumeUrl,
      }),
      { pretty: true }
    );

    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.DOCUMENT_VALIDATED
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Your Document Has Been Validated",
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send document validated email:", error);
      throw new Error(
        `Failed to send document validated email: ${error.message}`
      );
    }

    console.log("Document validated email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending document validated email:", error);
    throw error;
  }
}

/**
 * Send attorney new client notification email
 */
export async function sendAttorneyNewClientEmail(params: {
  to: string;
  attorneyName?: string;
  firmName?: string;
  claimant: ClaimantSummary;
  claim?: ClaimOverview;
}) {
  const { to, attorneyName, firmName, claimant, claim } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.ATTORNEY_NEW_CLIENT);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from ATTORNEY_NEW_CLIENT emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/attorney/dashboard`;
  const claimantUrl = claimant.claimId
    ? `${baseUrl}/attorney/claimants/${claimant.claimId}`
    : dashboardUrl;
  const settingsUrl = `${baseUrl}/attorney/settings`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.ATTORNEY_NEW_CLIENT
    );
    const emailHtml = await render(
      AttorneyNewClientNotification({
        attorneyName,
        firmName,
        claimant,
        claim,
        dashboardUrl,
        claimantUrl,
        settingsUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `New Client Assigned: ${claimant.name}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send attorney new client email:", error);
      throw new Error(
        `Failed to send attorney new client email: ${error.message}`
      );
    }

    console.log("Attorney new client email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending attorney new client email:", error);
    throw error;
  }
}

/**
 * Send client document follow-up email (cron-triggered)
 */
export async function sendClientDocumentFollowUpEmail(params: {
  to: string;
  claimantName?: string;
  progressPercent?: number;
  documents?: DocumentReminder[];
  cadenceLabel?: string;
}) {
  const { to, claimantName, progressPercent, documents, cadenceLabel } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.CLIENT_DOCUMENT_FOLLOW_UP
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from CLIENT_DOCUMENT_FOLLOW_UP emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.CLIENT_DOCUMENT_FOLLOW_UP
    );
    const emailHtml = await render(
      ClientDocumentFollowUpEmail({
        claimantName,
        progressPercent,
        portalUrl,
        documents,
        cadenceLabel,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Documents Needed for Your RECA Claim",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send document follow-up email:", error);
      throw new Error(
        `Failed to send document follow-up email: ${error.message}`
      );
    }

    console.log("Document follow-up email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending document follow-up email:", error);
    throw error;
  }
}

/**
 * Send client re-engagement email (cron-triggered)
 */
export async function sendReengagementEmail(params: {
  to: string;
  claimantName?: string;
  daysInactive?: number;
  priorityScore?: number;
  recommendedAction?: string;
}) {
  const { to, claimantName, daysInactive, priorityScore, recommendedAction } =
    params;

  const unsubscribed = await isUnsubscribed(to, EmailType.CLIENT_REENGAGEMENT);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from CLIENT_REENGAGEMENT emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const portalUrl = `${baseUrl}/portal`;
  const supportEmail = "support@radiantclaims.com";

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.CLIENT_REENGAGEMENT
    );
    const emailHtml = await render(
      ClientReengagementEmail({
        claimantName,
        daysInactive,
        priorityScore,
        recommendedAction,
        portalUrl,
        supportEmail,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Your RECA Claim is Waiting — Let's Get Back on Track",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send re-engagement email:", error);
      throw new Error(`Failed to send re-engagement email: ${error.message}`);
    }

    console.log("Re-engagement email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending re-engagement email:", error);
    throw error;
  }
}

/**
 * Send attorney activity summary email (cron-triggered)
 */
export async function sendAttorneyActivitySummaryEmail(params: {
  to: string;
  timeframeLabel?: string;
  metrics?: SummaryMetrics;
  activities?: ActivityItem[];
}) {
  const { to, timeframeLabel, metrics, activities } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.ATTORNEY_ACTIVITY_SUMMARY
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from ATTORNEY_ACTIVITY_SUMMARY emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/attorney/dashboard`;
  const managePreferencesUrl = `${baseUrl}/attorney/settings`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.ATTORNEY_ACTIVITY_SUMMARY
    );
    const emailHtml = await render(
      AttorneyActivitySummaryEmail({
        timeframeLabel,
        metrics,
        activities,
        dashboardUrl,
        managePreferencesUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Activity Summary — ${timeframeLabel || "Today"}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send attorney activity summary email:", error);
      throw new Error(
        `Failed to send attorney activity summary email: ${error.message}`
      );
    }

    console.log("Attorney activity summary email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending attorney activity summary email:", error);
    throw error;
  }
}

/**
 * Send firm onboarding email
 */
export async function sendFirmOnboardingEmail(params: {
  to: string;
  firmName: string;
  contactName: string;
  attorneyEmail: string;
  attorneyPassword: string;
  demoEmail: string;
  demoPassword: string;
}) {
  const {
    to,
    firmName,
    contactName,
    attorneyEmail,
    attorneyPassword,
    demoEmail,
    demoPassword,
  } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.FIRM_ONBOARDING);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from FIRM_ONBOARDING emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/login`;

  try {
    const emailHtml = await render(
      FirmOnboardingEmail({
        firmName,
        contactName,
        attorneyEmail,
        attorneyPassword,
        demoEmail,
        demoPassword,
        loginUrl,
      }),
      { pretty: true }
    );

    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.FIRM_ONBOARDING
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `Welcome to RadiantClaims — ${firmName} Onboarding`,
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send firm onboarding email:", error);
      throw new Error(`Failed to send firm onboarding email: ${error.message}`);
    }

    console.log("Firm onboarding email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending firm onboarding email:", error);
    throw error;
  }
}

/**
 * Send attorney welcome email
 */
export async function sendAttorneyWelcomeEmail(params: {
  to: string;
  name: string;
  email: string;
  temporaryPassword: string;
}) {
  const { to, name, email, temporaryPassword } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.ATTORNEY_WELCOME);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from ATTORNEY_WELCOME emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const loginUrl = `${baseUrl}/login`;
  const changePasswordUrl = `${baseUrl}/attorney/settings`;

  try {
    const emailHtml = await render(
      AttorneyWelcomeEmail({
        name,
        email,
        temporaryPassword,
        loginUrl,
        changePasswordUrl,
      }),
      { pretty: true }
    );

    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.ATTORNEY_WELCOME
    );
    const finalHtml = emailHtml.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "Welcome to RadiantClaims — Attorney Portal Access",
      html: finalHtml,
    });

    if (error) {
      console.error("Failed to send attorney welcome email:", error);
      throw new Error(
        `Failed to send attorney welcome email: ${error.message}`
      );
    }

    console.log("Attorney welcome email sent successfully:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending attorney welcome email:", error);
    throw error;
  }
}

/**
 * Send financial education celebration email (Day 1 of drip)
 */
export async function sendFinancialEdCelebrationEmail(params: {
  to: string;
  claimantName?: string;
  sessionId: string;
}) {
  const { to, claimantName, sessionId } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.FINANCIAL_ED_CELEBRATION
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from FINANCIAL_ED_CELEBRATION emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const whatComesNextUrl = `${baseUrl}/reca/what-comes-next/${sessionId}`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.FINANCIAL_ED_CELEBRATION
    );
    const emailHtml = await render(
      FinancialEdCelebrationEmail({
        claimantName,
        whatComesNextUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `You did it, ${claimantName || "friend"} — your claim is submitted`,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send financial ed celebration email:", error);
      throw new Error(
        `Failed to send financial ed celebration email: ${error.message}`
      );
    }

    console.log("Financial ed celebration email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending financial ed celebration email:", error);
    throw error;
  }
}

/**
 * Send financial education calculator email (Day 5 of drip)
 */
export async function sendFinancialEdCalculatorEmail(params: {
  to: string;
  claimantName?: string;
  sessionId: string;
}) {
  const { to, claimantName, sessionId } = params;

  const unsubscribed = await isUnsubscribed(
    to,
    EmailType.FINANCIAL_ED_CALCULATOR
  );
  if (unsubscribed) {
    console.log(
      `User ${to} has unsubscribed from FINANCIAL_ED_CALCULATOR emails`
    );
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const calculatorUrl = `${baseUrl}/reca/what-comes-next/${sessionId}#calculator`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.FINANCIAL_ED_CALCULATOR
    );
    const emailHtml = await render(
      FinancialEdCalculatorEmail({
        claimantName,
        calculatorUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "What could $100K become?",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send financial ed calculator email:", error);
      throw new Error(
        `Failed to send financial ed calculator email: ${error.message}`
      );
    }

    console.log("Financial ed calculator email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending financial ed calculator email:", error);
    throw error;
  }
}

/**
 * Send financial education tips email (Day 14 of drip)
 */
export async function sendFinancialEdTipsEmail(params: {
  to: string;
  claimantName?: string;
  sessionId: string;
}) {
  const { to, claimantName, sessionId } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.FINANCIAL_ED_TIPS);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from FINANCIAL_ED_TIPS emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const whatComesNextUrl = `${baseUrl}/reca/what-comes-next/${sessionId}`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.FINANCIAL_ED_TIPS
    );
    const emailHtml = await render(
      FinancialEdTipsEmail({
        claimantName,
        whatComesNextUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "3 things RECA recipients wish they knew sooner",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send financial ed tips email:", error);
      throw new Error(
        `Failed to send financial ed tips email: ${error.message}`
      );
    }

    console.log("Financial ed tips email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending financial ed tips email:", error);
    throw error;
  }
}

/**
 * Send financial education advisor email (Day 30 of drip)
 */
export async function sendFinancialEdAdvisorEmail(params: {
  to: string;
  claimantName?: string;
  sessionId: string;
}) {
  const { to, claimantName, sessionId } = params;

  const unsubscribed = await isUnsubscribed(to, EmailType.FINANCIAL_ED_ADVISOR);
  if (unsubscribed) {
    console.log(`User ${to} has unsubscribed from FINANCIAL_ED_ADVISOR emails`);
    return { success: false, reason: "unsubscribed" };
  }

  const baseUrl = getBaseUrl();
  const whatComesNextUrl = `${baseUrl}/reca/what-comes-next/${sessionId}#advisor`;

  try {
    const unsubscribeUrl = generateUnsubscribeUrl(
      to,
      EmailType.FINANCIAL_ED_ADVISOR
    );
    const emailHtml = await render(
      FinancialEdAdvisorEmail({
        claimantName,
        whatComesNextUrl,
        unsubscribeUrl,
      }),
      { pretty: true }
    );

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: "If you'd like to talk to someone who specializes in this",
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send financial ed advisor email:", error);
      throw new Error(
        `Failed to send financial ed advisor email: ${error.message}`
      );
    }

    console.log("Financial ed advisor email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Error sending financial ed advisor email:", error);
    throw error;
  }
}

/**
 * Send the Daily DOJ Post Draft to operators each morning.
 *
 * Recipients come from the `DAILY_POST_RECIPIENTS` env var (comma-
 * separated list). If the env var is unset, this function logs and
 * returns without sending — the admin page at /admin/daily-post is
 * always available as a fallback.
 *
 * Operators can click through the admin URL in the email to copy the
 * live draft with one tap (useful on mobile).
 */
export async function sendDailyPostDraftEmail(params: {
  postText: string;
  dateLabel: string;
  templateLabel: string;
  warnings: string[];
}) {
  const { postText, dateLabel, templateLabel, warnings } = params;

  const recipientsRaw = process.env.DAILY_POST_RECIPIENTS ?? "";
  const recipients = recipientsRaw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.log(
      "[sendDailyPostDraftEmail] DAILY_POST_RECIPIENTS not set — skipping"
    );
    return { success: false, reason: "no-recipients" as const };
  }

  const baseUrl = getBaseUrl();
  const adminPostUrl = `${baseUrl}/admin/daily-post`;

  try {
    const emailHtml = await render(
      DailyDojPostDraftEmail({
        dateLabel,
        templateLabel,
        postText,
        warnings,
        adminPostUrl,
      }),
      { pretty: true }
    );

    const subjectPrefix = warnings.length > 0 ? "⚠ " : "📊 ";
    const subject = `${subjectPrefix}Daily DOJ post draft — ${dateLabel}`;

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: recipients,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Failed to send daily DOJ post draft email:", error);
      throw new Error(
        `Failed to send daily DOJ post draft email: ${error.message}`
      );
    }

    console.log(
      "[sendDailyPostDraftEmail] sent to",
      recipients.join(", "),
      "id:",
      data?.id
    );
    return { success: true as const, emailId: data?.id };
  } catch (error) {
    console.error("Error sending daily DOJ post draft email:", error);
    throw error;
  }
}
