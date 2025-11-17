import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface ResourceAlternativesEmailProps {
  previewText?: string;
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
  portalUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

export const ResourceAlternativesEmail = ({
  previewText = "Having trouble getting your document? We can help with alternatives.",
  claimantName = "there",
  officeName,
  documentType,
  alternativeResources = [],
  feedbackUrl,
  chatUrl = "https://app.radiantclaims.com/chat",
  portalUrl = "https://app.radiantclaims.com/portal",
  supportEmail = "support@radiantclaims.com",
  unsubscribeUrl,
}: ResourceAlternativesEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="Need help with your document?"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Hi {claimantName}, we&apos;re still here to help
        </Heading>
        <Text style={mutedTextStyle}>
          We noticed you haven&apos;t heard back about getting your{" "}
          <strong>{documentType}</strong> from <strong>{officeName}</strong>.
          That&apos;s frustrating — but you have options.
        </Text>
      </Section>

      <Section style={alertCardStyle}>
        <Text style={alertHeadingStyle}>📋 Document still needed</Text>
        <Text style={alertTextStyle}>
          Your RECA claim packet can&apos;t move forward without this document.
          Let&apos;s get you unstuck.
        </Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Here&apos;s what you can do:</Text>
        <Section style={optionsListStyle}>
          <table style={optionCardStyle as any}>
            <tr>
              <td style={optionNumberCellStyle}>
                <table style={optionNumberTableStyle as any}>
                  <tr>
                    <td style={optionNumberStyle}>1</td>
                  </tr>
                </table>
              </td>
              <td style={{ padding: "0 0 0 12px" }}>
                <Text style={optionTitleStyle}>Tell us what happened</Text>
                <Text style={optionDescStyle}>
                  Did they not respond? Were they unhelpful? Your feedback helps
                  us find better alternatives.
                </Text>
              </td>
            </tr>
          </table>

          <table style={optionCardStyle as any}>
            <tr>
              <td style={optionNumberCellStyle}>
                <table style={optionNumberTableStyle as any}>
                  <tr>
                    <td style={optionNumberStyle}>2</td>
                  </tr>
                </table>
              </td>
              <td style={{ padding: "0 0 0 12px" }}>
                <Text style={optionTitleStyle}>Try alternative offices</Text>
                <Text style={optionDescStyle}>
                  Many documents can be obtained from multiple sources. We can
                  suggest alternatives based on your situation.
                </Text>
              </td>
            </tr>
          </table>

          <table style={optionCardStyle as any}>
            <tr>
              <td style={optionNumberCellStyle}>
                <table style={optionNumberTableStyle as any}>
                  <tr>
                    <td style={optionNumberStyle}>3</td>
                  </tr>
                </table>
              </td>
              <td style={{ padding: "0 0 0 12px" }}>
                <Text style={optionTitleStyle}>Get hands-on help</Text>
                <Text style={optionDescStyle}>
                  Our team can help you navigate difficult offices or find
                  workaround documents that satisfy RECA requirements.
                </Text>
              </td>
            </tr>
          </table>
        </Section>
      </Section>

      {alternativeResources.length > 0 && (
        <Section style={alternativesCardStyle}>
          <Text style={eyebrowStyle}>Alternative Resources</Text>
          <Text style={alternativesHeadingStyle}>
            Other places to try for {documentType}:
          </Text>
          {alternativeResources.map((resource, idx) => (
            <Section key={idx} style={altResourceStyle}>
              <Text style={altResourceNameStyle}>{resource.name}</Text>
              <Text style={altResourceTypeStyle}>{resource.type}</Text>
              {resource.phone && (
                <Text style={altResourcePhoneStyle}>{resource.phone}</Text>
              )}
            </Section>
          ))}
        </Section>
      )}

      <Section style={buttonGroupStyle}>
        <Button href={feedbackUrl} style={primaryButtonStyle}>
          Share your experience & get help
        </Button>
        <Button href={chatUrl} style={secondaryButtonStyle}>
          Chat with our team
        </Button>
      </Section>

      <Section style={reassuranceCardStyle}>
        <Text style={reassuranceTextStyle}>
          <strong>You&apos;re not alone.</strong> Many claimants struggle with
          unresponsive offices. We&apos;ve helped hundreds of people work around
          these issues — and we&apos;ll help you too.
        </Text>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Reply to this email or reach us at {supportEmail}. Getting your
        documents is our #1 priority.
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

const alertCardStyle = {
  border: "1px solid #fbbf24",
  borderRadius: "16px",
  padding: "16px",
  backgroundColor: "#fef3c7",
  marginTop: "12px",
};

const alertHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#92400e",
  marginBottom: "6px",
};

const alertTextStyle = {
  fontSize: "14px",
  color: "#78350f",
};

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "#c04a37",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

const sectionHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "12px",
};

const optionsListStyle = {
  marginTop: "12px",
};

const optionCardStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#f8fafc",
  borderRadius: "10px",
  marginBottom: "12px",
};

const optionNumberCellStyle = {
  width: "28px",
  verticalAlign: "top",
  padding: "0",
};

const optionNumberTableStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "14px",
  backgroundColor: "#d4674f",
};

const optionNumberStyle = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textAlign: "center" as const,
  verticalAlign: "middle",
  lineHeight: "28px",
  padding: "0",
  margin: "0",
};

const optionTitleStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "4px",
};

const optionDescStyle = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "20px",
};

const alternativesCardStyle = {
  backgroundColor: "#fdf6f4",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "16px",
  border: "1px solid #f5d1c4",
};

const alternativesHeadingStyle = {
  fontSize: "15px",
  fontWeight: 600,
  color: "#a03a2c",
  marginBottom: "12px",
};

const altResourceStyle = {
  padding: "10px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  marginBottom: "8px",
};

const altResourceNameStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
};

const altResourceTypeStyle = {
  fontSize: "13px",
  color: "#475569",
  marginTop: "2px",
};

const altResourcePhoneStyle = {
  fontSize: "13px",
  color: "#d4674f",
  marginTop: "2px",
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

const reassuranceCardStyle = {
  backgroundColor: "#f0fdf4",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "12px",
};

const reassuranceTextStyle = {
  fontSize: "14px",
  color: "#166534",
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

export default ResourceAlternativesEmail;
