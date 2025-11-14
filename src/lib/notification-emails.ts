import * as React from "react";
import { EmailType } from "@prisma/client";
import AttorneyNewClientNotification, {
  AttorneyNewClientNotificationProps,
} from "@/emails/attorney/new-client-notification";
import AttorneyActivitySummaryEmail, {
  AttorneyActivitySummaryEmailProps,
} from "@/emails/attorney/activity-summary";
import AttorneyPacketReadyEmail, {
  AttorneyPacketReadyEmailProps,
} from "@/emails/attorney/packet-ready-notification";
import ClientDocumentFollowUpEmail, {
  DocumentFollowUpEmailProps,
} from "@/emails/client/document-follow-up";
import ClientProgressMilestoneEmail, {
  ProgressMilestoneEmailProps,
} from "@/emails/client/progress-milestone";
import ClientReengagementEmail, {
  ReengagementEmailProps,
} from "@/emails/client/re-engagement";
import ClientDocumentAssistanceEmail, {
  DocumentAssistanceEmailProps,
} from "@/emails/client/document-assistance";
import {
  generateUnsubscribeUrl,
  isUnsubscribed,
} from "@/lib/email-preferences";
import { sendEmail } from "@/lib/resend";

type RecipientInput = string | string[];

interface SendResult {
  success: boolean;
  sentCount: number;
  skippedRecipients: string[];
  errors: { recipient: string; message: string }[];
}

const ATTORNEY_FROM = "RadiantClaims Alerts <notifications@radiantclaims.com>";
const CLIENT_FROM = "RadiantClaims Support <support@radiantclaims.com>";

type TemplateComponent<T extends { unsubscribeUrl?: string }> = (
  props: T
) => React.ReactElement;

async function deliverEmail<T extends { unsubscribeUrl?: string }>({
  recipients,
  emailType,
  subject,
  component,
  componentProps,
  from,
}: {
  recipients: RecipientInput;
  emailType: EmailType;
  subject: string;
  component: TemplateComponent<T>;
  componentProps: Omit<T, "unsubscribeUrl">;
  from: string;
}): Promise<SendResult> {
  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const skippedRecipients: string[] = [];
  const errors: { recipient: string; message: string }[] = [];
  let sentCount = 0;

  for (const recipient of recipientList) {
    const unsubscribed = await isUnsubscribed(recipient, emailType);
    if (unsubscribed) {
      skippedRecipients.push(recipient);
      continue;
    }

    const unsubscribeUrl = generateUnsubscribeUrl(recipient, emailType);
    const reactElement = component({
      ...(componentProps as T),
      unsubscribeUrl,
    });

    const result = await sendEmail({
      to: recipient,
      subject,
      from,
      react: reactElement,
    });

    if (result.success) {
      sentCount += 1;
    } else {
      errors.push({
        recipient,
        message: result.message ?? "Unknown delivery error",
      });
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    skippedRecipients,
    errors,
  };
}

export interface SendAttorneyNewClientParams
  extends Omit<AttorneyNewClientNotificationProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendAttorneyNewClientNotificationEmail({
  recipients,
  subject = "New Client Assigned",
  ...templateProps
}: SendAttorneyNewClientParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.ATTORNEY_NEW_CLIENT,
    subject,
    component: AttorneyNewClientNotification,
    componentProps: templateProps,
    from: ATTORNEY_FROM,
  });
}

export interface SendAttorneySummaryParams
  extends Omit<AttorneyActivitySummaryEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendAttorneyActivitySummaryEmail({
  recipients,
  subject = "Attorney Activity Summary",
  ...templateProps
}: SendAttorneySummaryParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.ATTORNEY_ACTIVITY_SUMMARY,
    subject,
    component: AttorneyActivitySummaryEmail,
    componentProps: templateProps,
    from: ATTORNEY_FROM,
  });
}

export interface SendAttorneyPacketReadyParams
  extends Omit<AttorneyPacketReadyEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendAttorneyPacketReadyNotificationEmail({
  recipients,
  subject = "Packet Ready for Review",
  ...templateProps
}: SendAttorneyPacketReadyParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.ATTORNEY_PACKET_READY,
    subject,
    component: AttorneyPacketReadyEmail,
    componentProps: templateProps,
    from: ATTORNEY_FROM,
  });
}

export interface SendClientDocumentFollowUpParams
  extends Omit<DocumentFollowUpEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendClientDocumentFollowUpEmail({
  recipients,
  subject = "Reminder: Documents Needed for Your RECA Claim",
  ...templateProps
}: SendClientDocumentFollowUpParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.CLIENT_DOCUMENT_FOLLOW_UP,
    subject,
    component: ClientDocumentFollowUpEmail,
    componentProps: templateProps,
    from: CLIENT_FROM,
  });
}

export interface SendClientProgressMilestoneParams
  extends Omit<ProgressMilestoneEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendClientProgressMilestoneEmail({
  recipients,
  subject = "Great Progress on Your RECA Claim",
  ...templateProps
}: SendClientProgressMilestoneParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.CLIENT_PROGRESS_MILESTONE,
    subject,
    component: ClientProgressMilestoneEmail,
    componentProps: templateProps,
    from: CLIENT_FROM,
  });
}

export interface SendClientReengagementParams
  extends Omit<ReengagementEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendClientReengagementEmail({
  recipients,
  subject = "Need a Hand Getting Re-Started?",
  ...templateProps
}: SendClientReengagementParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.CLIENT_REENGAGEMENT,
    subject,
    component: ClientReengagementEmail,
    componentProps: templateProps,
    from: CLIENT_FROM,
  });
}

export interface SendClientDocumentAssistanceParams
  extends Omit<DocumentAssistanceEmailProps, "unsubscribeUrl"> {
  recipients: RecipientInput;
  subject?: string;
}

export async function sendClientDocumentAssistanceEmail({
  recipients,
  subject = "We Found Help for Your Missing Document",
  ...templateProps
}: SendClientDocumentAssistanceParams) {
  return deliverEmail({
    recipients,
    emailType: EmailType.CLIENT_DOCUMENT_ASSISTANCE,
    subject,
    component: ClientDocumentAssistanceEmail,
    componentProps: templateProps,
    from: CLIENT_FROM,
  });
}
