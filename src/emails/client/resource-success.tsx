import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface ResourceSuccessEmailProps {
  previewText?: string;
  claimantName?: string;
  officeName: string;
  documentType: string;
  uploadUrl: string;
  portalUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export const ResourceSuccessEmail = ({
  previewText = "Great news! Now let's get that document uploaded to your claim.",
  claimantName = "there",
  officeName,
  documentType,
  uploadUrl,
  portalUrl = "https://app.radiantclaims.com/portal",
  supportEmail = "support@radiantclaims.com",
  unsubscribeUrl,
}: ResourceSuccessEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="Document obtained!"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          🎉 Congratulations, {claimantName}!
        </Heading>
        <Text style={mutedTextStyle}>
          You successfully obtained your <strong>{documentType}</strong> from{" "}
          <strong>{officeName}</strong>. That&apos;s a huge step forward for
          your RECA claim!
        </Text>
      </Section>

      <Section style={successCardStyle}>
        <Text style={successHeadingStyle}>✅ Document Secured</Text>
        <Text style={successTextStyle}>
          You&apos;re one step closer to a complete claim packet. Thank you for
          sharing your success with us!
        </Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Next step: Upload your document</Text>
        <Text style={mutedTextStyle}>
          Now that you have your <strong>{documentType}</strong>, upload it to
          your portal so we can:
        </Text>
        <Section style={bulletListStyle}>
          <Text style={bulletItemStyle}>
            ✓ Review it for RECA compliance (we&apos;ll let you know within 1
            business day)
          </Text>
          <Text style={bulletItemStyle}>
            ✓ Track your overall claim progress
          </Text>
          <Text style={bulletItemStyle}>
            ✓ Queue your packet for attorney review when complete
          </Text>
        </Section>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button href={uploadUrl} style={primaryButtonStyle}>
          Upload {documentType}
        </Button>
      </Section>

      <Section style={tipCardStyle}>
        <Text style={tipHeadingStyle}>💡 Upload tips</Text>
        <Section style={tipListStyle}>
          <Text style={tipItemStyle}>
            • Take a clear photo or scan (all text must be readable)
          </Text>
          <Text style={tipItemStyle}>
            • Include all pages if it&apos;s a multi-page document
          </Text>
          <Text style={tipItemStyle}>• JPG, PNG, or PDF formats work best</Text>
          <Text style={tipItemStyle}>
            • You&apos;ll get instant confirmation when it&apos;s uploaded
          </Text>
        </Section>
      </Section>

      <Section style={gratitudeCardStyle}>
        <Text style={gratitudeHeadingStyle}>Thank you for your feedback</Text>
        <Text style={gratitudeTextStyle}>
          By sharing your experience with <strong>{officeName}</strong>,
          you&apos;re helping other RECA claimants know what to expect. Your
          insights about response times, costs, and service quality make a real
          difference.
        </Text>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Questions about uploading? Reply to this email or reach us at{" "}
        {supportEmail}. We&apos;re here to help.
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

const successCardStyle = {
  border: "1px solid #c7cfc8",
  borderRadius: "16px",
  padding: "16px",
  backgroundColor: "#f6f7f6",
  textAlign: "center" as const,
  marginTop: "12px",
};

const successHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#4a594d",
  marginBottom: "6px",
};

const successTextStyle = {
  fontSize: "14px",
  color: "#5f7262",
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
  backgroundColor: "#5f7262",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  textAlign: "center" as const,
};

const tipCardStyle = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "12px",
};

const tipHeadingStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#92400e",
  marginBottom: "10px",
};

const tipListStyle = {
  paddingLeft: "4px",
};

const tipItemStyle = {
  fontSize: "14px",
  color: "#78350f",
  lineHeight: "20px",
  marginBottom: "6px",
};

const gratitudeCardStyle = {
  backgroundColor: "#fdf6f4",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "12px",
  border: "1px solid #f5d1c4",
};

const gratitudeHeadingStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#a03a2c",
  marginBottom: "8px",
};

const gratitudeTextStyle = {
  fontSize: "14px",
  color: "#853329",
  lineHeight: "20px",
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

export default ResourceSuccessEmail;
