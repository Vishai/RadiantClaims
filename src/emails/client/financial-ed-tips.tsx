import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface FinancialEdTipsProps {
  previewText?: string;
  claimantName?: string;
  whatComesNextUrl?: string;
  unsubscribeUrl?: string;
}

export const FinancialEdTipsEmail = ({
  previewText = "3 things RECA recipients wish they knew sooner.",
  claimantName = "there",
  whatComesNextUrl = "https://app.radiantclaims.com/reca/what-comes-next",
  unsubscribeUrl,
}: FinancialEdTipsProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="3 Things Worth Knowing"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={introSection}>
        <Text style={bodyTextStyle}>
          {claimantName}, your claim is still being processed — and that&apos;s
          normal. RECA claims take time. While you wait, here are three things
          other recipients wish they&apos;d known before their compensation
          arrived.
        </Text>
      </Section>

      {/* Tip 1 */}
      <Section style={tipCardStyle}>
        <Text style={tipNumberStyle}>1</Text>
        <Heading as="h3" style={tipHeadingStyle}>
          The 90-Day Rule
        </Heading>
        <Text style={tipTextStyle}>
          Financial advisors often recommend waiting at least 90 days before
          making any major financial decisions after receiving a lump sum. Give
          yourself time to think clearly about what matters most to you and your
          family.
        </Text>
      </Section>

      {/* Tip 2 */}
      <Section style={tipCardStyle}>
        <Text style={tipNumberStyle}>2</Text>
        <Heading as="h3" style={tipHeadingStyle}>
          RECA Payments Are Generally Not Taxable
        </Heading>
        <Text style={tipTextStyle}>
          RECA compensation is typically excluded from federal income tax. This
          means the full amount is yours to work with. However, any investment
          gains on that money may be taxable — it&apos;s worth understanding the
          difference.
        </Text>
      </Section>

      {/* Tip 3 */}
      <Section style={tipCardStyle}>
        <Text style={tipNumberStyle}>3</Text>
        <Heading as="h3" style={tipHeadingStyle}>
          Even Conservative Growth Adds Up
        </Heading>
        <Text style={tipTextStyle}>
          You don&apos;t need to be a risk-taker. Even a conservative approach
          can turn $100,000 into significantly more over 10 or 20 years.
          Compound growth is simple math — and it works in your favor if you
          give it time.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButtonStyle} href={whatComesNextUrl}>
          Explore Your Options
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

const tipCardStyle = {
  backgroundColor: "#f8faf8",
  border: "1px solid #d1ddd4",
  borderRadius: "12px",
  padding: "20px",
  margin: "12px 0",
};

const tipNumberStyle = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#7a8c7e",
  margin: "0 0 4px",
  lineHeight: "1",
};

const tipHeadingStyle = {
  fontSize: "16px",
  color: "#0f172a",
  fontWeight: 600,
  margin: "0 0 8px",
};

const tipTextStyle = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.6",
  margin: "0",
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

export default FinancialEdTipsEmail;
