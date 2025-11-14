import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface DocumentReminder {
  name: string;
  description: string;
  status: "missing" | "in_review" | "uploaded";
  dueDate?: string;
}

export interface DocumentFollowUpEmailProps {
  previewText?: string;
  claimantName?: string;
  progressPercent?: number;
  portalUrl?: string;
  supportEmail?: string;
  documents?: DocumentReminder[];
  cadenceLabel?: string;
  unsubscribeUrl?: string;
}

const defaultDocuments: DocumentReminder[] = [
  {
    name: "Proof of Residency (1956-1961)",
    description:
      "Utility bill, mortgage, tax return, or school record from that period.",
    status: "missing",
    dueDate: "Upload within 3 days",
  },
  {
    name: "Medical Diagnosis",
    description:
      "Pathology report or physician letter confirming lung cancer diagnosis.",
    status: "in_review",
    dueDate: "Submitted yesterday",
  },
];

export const ClientDocumentFollowUpEmail = ({
  previewText = "Just a few documents left — upload them to keep your RECA claim moving.",
  claimantName = "Mary",
  progressPercent = 62,
  portalUrl = "https://app.radiantclaims.com/portal/documents",
  supportEmail = "support@radiantclaims.com",
  documents = defaultDocuments,
  cadenceLabel = "Active Support · Touch 3 of 6",
  unsubscribeUrl,
}: DocumentFollowUpEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="Document Follow-Up"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Hi {claimantName}, let&apos;s wrap up these documents
        </Heading>
        <Text style={mutedTextStyle}>
          You&apos;re {progressPercent}% of the way there. Uploading the items
          below ensures we can queue your packet for attorney review without
          delay.
        </Text>
      </Section>

      <Section style={progressCardStyle}>
        <Text style={eyebrowStyle}>{cadenceLabel}</Text>
        <Text style={progressValueStyle}>{progressPercent}% complete</Text>
        <Text style={mutedTextStyle}>
          Documents reviewed within 1 business day.
        </Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>Outstanding Items</Text>
        <Section style={documentListStyle}>
          {documents.map((doc) => (
            <Section key={doc.name} style={documentRowStyle}>
              <div style={documentHeaderStyle}>
                <Text style={documentNameStyle}>{doc.name}</Text>
                <span style={statusBadgeStyles[doc.status]}>
                  {doc.status === "missing"
                    ? "Needed"
                    : doc.status === "in_review"
                      ? "In Review"
                      : "Uploaded"}
                </span>
              </div>
              <Text style={documentDescriptionStyle}>{doc.description}</Text>
              {doc.dueDate ? (
                <Text style={documentDueStyle}>{doc.dueDate}</Text>
              ) : null}
            </Section>
          ))}
        </Section>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button href={portalUrl} style={primaryButtonStyle}>
          Upload documents
        </Button>
        <Button href={`mailto:${supportEmail}`} style={secondaryButtonStyle}>
          I need help
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Reply to this email or reach us at {supportEmail}. Every upload gets
        instant confirmation so you always know what&apos;s next.
      </Text>
    </ClientEmailLayout>
  );
};

const cardSectionStyle = {
  padding: "16px 0",
};

const cardHeadingStyle = {
  fontSize: "20px",
  color: "#0f172a",
  marginBottom: "6px",
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const progressCardStyle = {
  border: "1px solid #bae6fd",
  borderRadius: "16px",
  padding: "16px",
  backgroundColor: "#e0f2fe",
  textAlign: "center" as const,
};

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "#0284c7",
  textTransform: "uppercase" as const,
};

const progressValueStyle = {
  fontSize: "32px",
  fontWeight: 600,
  color: "#075985",
  margin: "8px 0",
};

const documentListStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
};

const documentRowStyle = {
  padding: "16px",
  borderBottom: "1px solid #e2e8f0",
};

const documentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
};

const documentNameStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
};

const documentDescriptionStyle = {
  color: "#475569",
  fontSize: "14px",
  margin: "6px 0",
};

const documentDueStyle = {
  fontSize: "13px",
  color: "#0ea5e9",
};

const statusBadgeStyles = {
  missing: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  in_review: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  uploaded: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
} as const;

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "12px",
};

const primaryButtonStyle = {
  backgroundColor: "#0284c7",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  backgroundColor: "#ecfeff",
  color: "#0f172a",
  padding: "12px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const lightDividerStyle = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const metaTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
};

export default ClientDocumentFollowUpEmail;
