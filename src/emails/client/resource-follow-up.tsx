import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface ResourceFollowUpEmailProps {
  previewText?: string;
  claimantName?: string;
  officeName: string;
  officeType: string; // "Vital Records Office", "Medical Records Office", etc.
  documentType: string; // What they were looking for
  searchQuery?: string; // Original query
  feedbackUrl: string; // Link to /feedback/[interactionId]
  alternativesUrl?: string; // Link to alternative resources
  portalUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export const ResourceFollowUpEmail = ({
  previewText = "We'd love to hear how it went with your document request.",
  claimantName = "there",
  officeName,
  // officeType,
  documentType,
  searchQuery,
  feedbackUrl,
  alternativesUrl,
  portalUrl = "https://app.radiantclaims.com/portal",
  supportEmail = "support@radiantclaims.com",
  unsubscribeUrl,
}: ResourceFollowUpEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="How did it go?"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Hi {claimantName}, did you get your document?
        </Heading>
        <Text style={mutedTextStyle}>
          A few days ago, you asked about getting your{" "}
          <strong>{documentType}</strong>
          {searchQuery ? ` (${searchQuery})` : ""}, and we pointed you to{" "}
          <strong>{officeName}</strong>.
        </Text>
        <Text style={mutedTextStyle}>
          We&apos;d love to hear how it went — your feedback helps us help other
          claimants like you.
        </Text>
      </Section>

      <Section style={highlightCardStyle}>
        <Text style={eyebrowStyle}>Quick Check-In</Text>
        <Text style={highlightTextStyle}>Did you contact {officeName}?</Text>
        <Text style={mutedTextStyle}>
          Whether you reached out or not, we want to know. Your experience helps
          us improve our recommendations and support other RECA claimants.
        </Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>
          What we&apos;re asking (takes 2 minutes):
        </Text>
        <Section style={bulletListStyle}>
          <Text style={bulletItemStyle}>
            ✓ Did you contact the office? How quickly did they respond?
          </Text>
          <Text style={bulletItemStyle}>
            ✓ Were they helpful? Did you get your document?
          </Text>
          <Text style={bulletItemStyle}>
            ✓ Any costs or processing times we should know about?
          </Text>
          <Text style={bulletItemStyle}>
            ✓ Any tips for other claimants requesting the same document?
          </Text>
        </Section>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button href={feedbackUrl} style={primaryButtonStyle}>
          Share your experience
        </Button>
        {alternativesUrl && (
          <Button href={alternativesUrl} style={secondaryButtonStyle}>
            I need alternative options
          </Button>
        )}
      </Section>

      <Section style={valueCardStyle}>
        <Text style={valueHeadingStyle}>Why your feedback matters</Text>
        <Text style={valueTextStyle}>
          Every RECA claim requires documents from offices across the country.
          Your experience helps us:
        </Text>
        <Section style={valueListStyle}>
          <Text style={valueItemStyle}>
            • Update our database with real response times and costs
          </Text>
          <Text style={valueItemStyle}>
            • Warn others about offices that are slow or unresponsive
          </Text>
          <Text style={valueItemStyle}>
            • Connect claimants with the offices that actually help
          </Text>
          <Text style={valueItemStyle}>
            • Track your document collection progress in your portal
          </Text>
        </Section>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Reply to this email or reach us at {supportEmail}. We&apos;re here to
        help you get every document you need for your RECA claim.
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
  fontWeight: 600,
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
  marginBottom: "12px",
};

const highlightCardStyle = {
  border: "1px solid #f5d1c4",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#fdf6f4",
  textAlign: "center" as const,
  marginTop: "12px",
};

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "#c04a37",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const highlightTextStyle = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#a03a2c",
  marginBottom: "8px",
};

const sectionHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "12px",
};

const bulletListStyle = {
  paddingLeft: "4px",
};

const bulletItemStyle = {
  color: "#475569",
  fontSize: "14px",
  lineHeight: "22px",
  marginBottom: "8px",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "16px",
  marginBottom: "16px",
};

const primaryButtonStyle = {
  backgroundColor: "#d4674f",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  textAlign: "center" as const,
};

const secondaryButtonStyle = {
  backgroundColor: "#fdf6f4",
  color: "#0f172a",
  padding: "12px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  textAlign: "center" as const,
  border: "1px solid #f5d1c4",
};

const valueCardStyle = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "12px",
};

const valueHeadingStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "8px",
};

const valueTextStyle = {
  fontSize: "14px",
  color: "#475569",
  marginBottom: "10px",
};

const valueListStyle = {
  paddingLeft: "4px",
};

const valueItemStyle = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "20px",
  marginBottom: "6px",
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

export default ResourceFollowUpEmail;
