import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface FinancialEdCalculatorProps {
  previewText?: string;
  claimantName?: string;
  calculatorUrl?: string;
  unsubscribeUrl?: string;
}

export const FinancialEdCalculatorEmail = ({
  previewText = "What could $100K become? Open the calculator to find out.",
  claimantName = "there",
  calculatorUrl = "https://app.radiantclaims.com/reca/what-comes-next#calculator",
  unsubscribeUrl,
}: FinancialEdCalculatorProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="Your Compensation, Over Time"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={introSection}>
        <Text style={bodyTextStyle}>
          {claimantName}, one of the most powerful things about your RECA
          compensation is what it can become if even a portion of it has time to
          grow.
        </Text>
        <Text style={bodyTextStyle}>
          Here&apos;s a quick look at what $100,000 could become at a moderate
          6% annual return:
        </Text>
      </Section>

      <Section style={previewGrid}>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td style={previewCell}>
                <Text style={previewLabel}>10 Years</Text>
                <Text style={previewAmount}>~$179,085</Text>
              </td>
              <td style={previewCell}>
                <Text style={previewLabel}>20 Years</Text>
                <Text style={previewAmount}>~$320,714</Text>
              </td>
              <td style={previewCell}>
                <Text style={previewLabel}>30 Years</Text>
                <Text style={previewAmount}>~$574,349</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={noteSection}>
        <Text style={noteTextStyle}>
          These numbers are simplified illustrations for educational purposes.
          Actual returns vary. This is not financial advice.
        </Text>
      </Section>

      <Section style={bodySection}>
        <Text style={bodyTextStyle}>
          Want to see what different amounts, rates, and timeframes look like?
          We built an interactive calculator just for you.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButtonStyle} href={calculatorUrl}>
          Open the Interactive Calculator
        </Button>
      </Section>
    </ClientEmailLayout>
  );
};

const introSection = {
  padding: "8px 0",
};

const bodyTextStyle = {
  fontSize: "15px",
  color: "#475569",
  lineHeight: "1.6",
};

const previewGrid = {
  margin: "16px 0",
};

const previewCell = {
  textAlign: "center" as const,
  padding: "16px 8px",
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "10px",
  width: "33.33%",
};

const previewLabel = {
  fontSize: "12px",
  color: "#15803d",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  fontWeight: 600,
  margin: "0 0 4px",
};

const previewAmount = {
  fontSize: "20px",
  color: "#166534",
  fontWeight: 700,
  margin: "0",
};

const noteSection = {
  padding: "4px 0",
};

const noteTextStyle = {
  fontSize: "12px",
  color: "#94a3b8",
  textAlign: "center" as const,
  fontStyle: "italic" as const,
};

const bodySection = {
  padding: "8px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  padding: "16px 0 8px",
};

const ctaButtonStyle = {
  backgroundColor: "#d4674f",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 28px",
  borderRadius: "10px",
  textDecoration: "none",
  display: "inline-block",
};

export default FinancialEdCalculatorEmail;
