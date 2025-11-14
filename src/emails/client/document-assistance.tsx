import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface AssistanceResource {
  title: string;
  description: string;
  link?: string;
}

export interface DocumentAssistanceEmailProps {
  previewText?: string;
  claimantName?: string;
  documentName?: string;
  assistanceLevel?: 1 | 2 | 3;
  resources?: AssistanceResource[];
  portalUrl?: string;
  staffContactEmail?: string;
  formDownloadUrl?: string;
  unsubscribeUrl?: string;
}

const defaultResources: AssistanceResource[] = [
  {
    title: "Arizona Department of Health Services",
    description:
      "Submit a Vital Records request online or by mail. Typical turnaround 5-7 business days.",
    link: "https://azdhs.gov/vital-records",
  },
  {
    title: "Residency Affidavit Template",
    description:
      "Use this fillable PDF if you need a neighbor or local official to certify residency.",
    link: "https://radiantclaims.com/resources/residency-affidavit.pdf",
  },
];

export const ClientDocumentAssistanceEmail = ({
  previewText = "We pulled together resources to help you secure the last document.",
  claimantName = "Mary",
  documentName = "Proof of Residency (1956-1961)",
  assistanceLevel = 2,
  resources = defaultResources,
  portalUrl = "https://app.radiantclaims.com/portal/assistance",
  staffContactEmail = "support@radiantclaims.com",
  formDownloadUrl = "https://radiantclaims.com/forms/prefilled.pdf",
  unsubscribeUrl,
}: DocumentAssistanceEmailProps) => {
  const levelCopy: Record<1 | 2 | 3, string> = {
    1: "Automatic resources: we curated contacts, forms, and step-by-step instructions.",
    2: "Guided support: we pre-filled everything we could to save you time.",
    3: "Direct staff assistance: a specialist will reach out to finish this with you.",
  };

  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="Document Assistance"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Help for {documentName}
        </Heading>
        <Text style={mutedTextStyle}>
          Hey {claimantName}, this document is required before we can finalize
          your packet. We bumped you to assistance level {assistanceLevel} so
          you don’t have to figure it out alone.
        </Text>
        <Text style={mutedTextStyle}>{levelCopy[assistanceLevel]}</Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Resources</Text>
        <Section style={resourceListStyle}>
          {resources.map((resource) => (
            <Section key={resource.title} style={resourceRowStyle}>
              <Text style={resourceTitleStyle}>{resource.title}</Text>
              <Text style={resourceDescriptionStyle}>
                {resource.description}
              </Text>
              {resource.link ? (
                <a href={resource.link} style={linkStyle}>
                  Open resource →
                </a>
              ) : null}
            </Section>
          ))}
        </Section>
      </Section>

      {formDownloadUrl ? (
        <Section style={cardSectionStyle}>
          <Text style={sectionHeadingStyle}>Pre-filled form</Text>
          <Text style={mutedTextStyle}>
            Download, review, and sign. If anything looks off, reply to this
            email and we’ll adjust.
          </Text>
          <Button href={formDownloadUrl} style={primaryButtonStyle}>
            Download form
          </Button>
        </Section>
      ) : null}

      <Section style={buttonGroupStyle}>
        <Button href={portalUrl} style={secondaryButtonStyle}>
          View assistance tracker
        </Button>
        <Button
          href={`mailto:${staffContactEmail}`}
          style={tertiaryButtonStyle}
        >
          Request staff call
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Level 3 support is available if you need a human to call offices on your
        behalf. Let us know and we’ll get the proper authorization forms ready.
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

const sectionHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "8px",
};

const resourceListStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
};

const resourceRowStyle = {
  padding: "16px",
  borderBottom: "1px solid #e2e8f0",
};

const resourceTitleStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
};

const resourceDescriptionStyle = {
  fontSize: "14px",
  color: "#475569",
  margin: "6px 0",
};

const linkStyle = {
  color: "#0284c7",
  textDecoration: "none",
  fontWeight: 600,
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "16px",
};

const primaryButtonStyle = {
  backgroundColor: "#0ea5e9",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  marginTop: "12px",
};

const secondaryButtonStyle = {
  backgroundColor: "#ecfeff",
  color: "#0369a1",
  padding: "12px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const tertiaryButtonStyle = {
  backgroundColor: "#f8fafc",
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

export default ClientDocumentAssistanceEmail;
