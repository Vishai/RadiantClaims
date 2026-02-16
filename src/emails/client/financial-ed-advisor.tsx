import { Button, Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface FinancialEdAdvisorProps {
  previewText?: string;
  claimantName?: string;
  advisorUrl?: string;
  whatComesNextUrl?: string;
  unsubscribeUrl?: string;
}

export const FinancialEdAdvisorEmail = ({
  previewText = "If you'd like to talk to someone who specializes in this.",
  claimantName = "there",
  advisorUrl = "https://p4wealth.com?utm_source=radiantclaims&utm_medium=email&utm_campaign=reca_financial_ed&utm_content=day30_advisor",
  whatComesNextUrl = "https://app.radiantclaims.com/reca/what-comes-next#advisor",
  unsubscribeUrl,
}: FinancialEdAdvisorProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="A Resource, If You Want It"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={introSection}>
        <Text style={bodyTextStyle}>
          {claimantName}, it&apos;s been about a month since you submitted your
          claim. Some people prefer to figure things out on their own — and
          that&apos;s completely fine. Others like having a sounding board.
        </Text>
        <Text style={bodyTextStyle}>
          If you&apos;re in the second group, we wanted to let you know about a
          resource that&apos;s available to you.
        </Text>
      </Section>

      <Section style={advisorCardStyle}>
        <Heading as="h3" style={advisorHeadingStyle}>
          P4 Wealth
        </Heading>
        <Text style={advisorTextStyle}>
          P4 Wealth is a financial planning firm that works with RECA
          recipients. They understand the unique situation you&apos;re in — from
          the tax implications of your compensation to building a plan that
          reflects what matters to your family.
        </Text>
        <Text style={advisorTextStyle}>
          You can schedule a free, no-obligation consultation to ask questions
          and see if it&apos;s a good fit.
        </Text>
        <Text style={contactTextStyle}>
          Contact: Darin Arnell —{" "}
          <Link href="mailto:darin.arnell@p4wealth.com" style={linkStyle}>
            darin.arnell@p4wealth.com
          </Link>
        </Text>
      </Section>

      <Section style={disclosureStyle}>
        <Text style={disclosureTextStyle}>
          <strong>Disclosure:</strong> RadiantClaims has partnered with P4
          Wealth and may receive a referral fee. This does not affect the advice
          you receive or your cost. We only recommend firms we&apos;ve vetted
          and would use ourselves.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButtonStyle} href={advisorUrl}>
          Visit P4 Wealth
        </Button>
      </Section>

      <Section style={altSection}>
        <Text style={altTextStyle}>
          Not interested? That&apos;s totally fine — no further emails about
          this. You can always visit our{" "}
          <Link href={whatComesNextUrl} style={linkStyle}>
            financial planning resources
          </Link>{" "}
          in your portal if you change your mind later.
        </Text>
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

const advisorCardStyle = {
  backgroundColor: "#f8faf8",
  border: "1px solid #d1ddd4",
  borderRadius: "12px",
  padding: "20px",
  margin: "16px 0",
};

const advisorHeadingStyle = {
  fontSize: "18px",
  color: "#0f172a",
  fontWeight: 600,
  margin: "0 0 8px",
};

const advisorTextStyle = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const contactTextStyle = {
  fontSize: "14px",
  color: "#334155",
  fontWeight: 500,
  margin: "12px 0 0",
};

const linkStyle = {
  color: "#d4674f",
  textDecoration: "none",
};

const disclosureStyle = {
  backgroundColor: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: "10px",
  padding: "14px 16px",
  margin: "8px 0",
};

const disclosureTextStyle = {
  fontSize: "13px",
  color: "#713f12",
  lineHeight: "1.5",
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

const altSection = {
  padding: "4px 0",
};

const altTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  lineHeight: "1.5",
  textAlign: "center" as const,
};

export default FinancialEdAdvisorEmail;
