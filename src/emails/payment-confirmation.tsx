import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "./components/ClientEmailLayout";

export interface PaymentConfirmationEmailProps {
  name?: string;
  amount?: string;
  paymentType?: string;
  planDescription?: string;
  portalUrl?: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export const PaymentConfirmationEmail = ({
  name = "there",
  amount = "$499.00",
  paymentType = "Setup Fee",
  planDescription = "DIY Prep — Full Payment",
  portalUrl = "https://app.radiantclaims.com/portal",
  previewText = "Payment received — your RECA claim preparation is active.",
  unsubscribeUrl,
}: PaymentConfirmationEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="Payment Confirmed"
      portalUrl={portalUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroCardStyle}>
        <Text style={eyebrowStyle}>Payment received</Text>
        <Heading as="h2" style={heroHeadingStyle}>
          Thank you, {name}
        </Heading>
        <Text style={amountStyle}>{amount}</Text>
        <Text style={mutedTextStyle}>{planDescription}</Text>
      </Section>

      <Section style={detailCardStyle}>
        <Text style={sectionHeadingStyle}>Payment details</Text>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelCellStyle}>Type</td>
              <td style={valueCellStyle}>{paymentType}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Amount</td>
              <td style={valueCellStyle}>{amount}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Plan</td>
              <td style={valueCellStyle}>{planDescription}</td>
            </tr>
            <tr>
              <td style={labelCellStyle}>Status</td>
              <td style={valueCellStyle}>
                <span style={badgeStyle}>Paid</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={detailCardStyle}>
        <Text style={sectionHeadingStyle}>What happens next?</Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>Your account is now fully active</li>
          <li style={listItemStyle}>
            Continue building your RECA claim in the portal
          </li>
          <li style={listItemStyle}>Upload supporting documents at any time</li>
        </ul>
        <Button href={portalUrl} style={primaryButtonStyle}>
          Go to your portal
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        This is your receipt. If you have billing questions, contact
        support@radiantclaims.com
      </Text>
    </ClientEmailLayout>
  );
};

const heroCardStyle = {
  border: "1px solid #bbf7d0",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#f0fdf4",
  textAlign: "center" as const,
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#16a34a",
};

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#166534",
  margin: "8px 0",
};

const amountStyle = {
  fontSize: "36px",
  color: "#15803d",
  fontWeight: 600,
  marginTop: "8px",
  marginBottom: "4px",
};

const mutedTextStyle = {
  color: "#4b5563",
  fontSize: "14px",
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

const tableStyle = {
  width: "100%",
  fontSize: "14px",
};

const labelCellStyle = {
  padding: "6px 0",
  color: "#6b7280",
  width: "120px",
};

const valueCellStyle = {
  padding: "6px 0",
  color: "#111827",
  fontWeight: 500 as const,
};

const badgeStyle = {
  backgroundColor: "#dcfce7",
  color: "#166534",
  padding: "2px 8px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: 600,
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
  backgroundColor: "#16a34a",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-block",
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

export default PaymentConfirmationEmail;
