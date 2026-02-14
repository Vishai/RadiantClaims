import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "./components/ClientEmailLayout";

export interface PaymentFailedEmailProps {
  name?: string;
  amount?: string;
  failureReason?: string;
  portalUrl?: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export const PaymentFailedEmail = ({
  name = "there",
  amount = "$249.99",
  failureReason = "Your payment method was declined",
  portalUrl = "https://app.radiantclaims.com/portal",
  previewText = "Action needed — your recent payment didn't go through.",
  unsubscribeUrl,
}: PaymentFailedEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="Payment Issue"
      portalUrl={portalUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroCardStyle}>
        <Text style={eyebrowStyle}>Action needed</Text>
        <Heading as="h2" style={heroHeadingStyle}>
          Payment unsuccessful
        </Heading>
        <Text style={bodyTextStyle}>
          {name}, we weren&apos;t able to process your payment of{" "}
          <strong>{amount}</strong>.
        </Text>
      </Section>

      <Section style={detailCardStyle}>
        <Text style={sectionHeadingStyle}>What happened</Text>
        <Text style={bodyTextStyle}>{failureReason}</Text>
      </Section>

      <Section style={detailCardStyle}>
        <Text style={sectionHeadingStyle}>How to fix this</Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Check that your card details are up to date
          </li>
          <li style={listItemStyle}>Ensure sufficient funds are available</li>
          <li style={listItemStyle}>Contact your bank if the issue persists</li>
        </ul>
        <Text style={bodyTextStyle}>
          We&apos;ll automatically retry the payment. You can also update your
          payment method in the portal.
        </Text>
        <Button href={portalUrl} style={primaryButtonStyle}>
          Update payment method
        </Button>
      </Section>

      <Section style={reassuranceStyle}>
        <Text style={bodyTextStyle}>
          Your claim data is safe and your progress is preserved. Once payment
          is resolved, everything picks up right where you left off.
        </Text>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Need help? Contact support@radiantclaims.com
      </Text>
    </ClientEmailLayout>
  );
};

const heroCardStyle = {
  border: "1px solid #fecaca",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#fef2f2",
  textAlign: "center" as const,
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#dc2626",
};

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#991b1b",
  margin: "8px 0",
};

const bodyTextStyle = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
};

const detailCardStyle = {
  marginTop: "18px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
};

const sectionHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "8px",
};

const listStyle = {
  margin: "0 0 12px 18px",
  padding: 0,
  color: "#1f2937",
  fontSize: "15px",
};

const listItemStyle = {
  marginBottom: "6px",
};

const primaryButtonStyle = {
  backgroundColor: "#dc2626",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-block",
};

const reassuranceStyle = {
  marginTop: "18px",
  padding: "16px",
  borderRadius: "16px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
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

export default PaymentFailedEmail;
