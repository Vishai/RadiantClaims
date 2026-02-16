import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface FinancialEdCelebrationProps {
  previewText?: string;
  claimantName?: string;
  whatComesNextUrl?: string;
  unsubscribeUrl?: string;
}

export const FinancialEdCelebrationEmail = ({
  previewText = "Your claim is submitted — here's what smart recipients do next.",
  claimantName = "there",
  whatComesNextUrl = "https://app.radiantclaims.com/reca/what-comes-next",
  unsubscribeUrl,
}: FinancialEdCelebrationProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="You Did It"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroStyle}>
        <Text style={sparkleStyle}>&#10024;</Text>
        <Heading as="h2" style={heroHeadingStyle}>
          Congratulations, {claimantName}.
        </Heading>
        <Text style={heroTextStyle}>
          Your RECA claim is submitted to the Department of Justice. You just
          completed a 16-part federal application — that takes real
          determination. Most people never finish.
        </Text>
      </Section>

      <Section style={statBoxStyle}>
        <Text style={statLabelStyle}>Did you know?</Text>
        <Text style={statTextStyle}>
          Research shows that the majority of people who receive a lump-sum
          payment spend it within 18 months — often before they&apos;ve had time
          to think about what it could become.
        </Text>
      </Section>

      <Section style={bodySection}>
        <Text style={bodyTextStyle}>
          You&apos;ve already proven you&apos;re someone who plans ahead. You
          didn&apos;t take shortcuts on your claim, and you don&apos;t have to
          take shortcuts with your compensation either.
        </Text>
        <Text style={bodyTextStyle}>
          We built a simple tool to show you what your compensation could look
          like over time — no sign-ups, no commitments, just math.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={ctaButtonStyle} href={whatComesNextUrl}>
          See What Your Compensation Could Become
        </Button>
      </Section>
    </ClientEmailLayout>
  );
};

const heroStyle = {
  textAlign: "center" as const,
  padding: "24px 16px",
};

const sparkleStyle = {
  fontSize: "40px",
  lineHeight: "1",
  margin: "0",
};

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#0f172a",
  fontWeight: 600,
  margin: "12px 0 8px",
};

const heroTextStyle = {
  fontSize: "15px",
  color: "#475569",
  lineHeight: "1.6",
};

const statBoxStyle = {
  backgroundColor: "#fef7f5",
  border: "1px solid #f5d1c4",
  borderRadius: "12px",
  padding: "20px",
  margin: "16px 0",
};

const statLabelStyle = {
  fontSize: "12px",
  color: "#d4674f",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  fontWeight: 600,
  margin: "0 0 8px",
};

const statTextStyle = {
  fontSize: "15px",
  color: "#334155",
  lineHeight: "1.6",
  margin: "0",
};

const bodySection = {
  padding: "8px 0",
};

const bodyTextStyle = {
  fontSize: "15px",
  color: "#475569",
  lineHeight: "1.6",
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

export default FinancialEdCelebrationEmail;
