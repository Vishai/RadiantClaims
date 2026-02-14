import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "./components/ClientEmailLayout";

export interface IntakeStartedEmailProps {
  name?: string;
  sessionId?: string;
  portalUrl?: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export const IntakeStartedEmail = ({
  name = "there",
  sessionId: _sessionId,
  portalUrl = "https://app.radiantclaims.com/portal",
  previewText = "Your RECA claim preparation has begun — here's what to expect.",
  unsubscribeUrl,
}: IntakeStartedEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="Claim Started"
      portalUrl={portalUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroCardStyle}>
        <Text style={eyebrowStyle}>You&apos;re underway</Text>
        <Heading as="h2" style={heroHeadingStyle}>
          Welcome, {name}
        </Heading>
        <Text style={bodyTextStyle}>
          Your RECA claim preparation has officially started. We&apos;ll guide
          you through every step.
        </Text>
      </Section>

      <Section style={infoCardStyle}>
        <Text style={sectionHeadingStyle}>The process at a glance</Text>
        <ol style={listStyle}>
          <li style={listItemStyle}>
            <strong>Fill out the form</strong> — 16 sections covering your
            history, exposure, and health
          </li>
          <li style={listItemStyle}>
            <strong>Upload documents</strong> — we&apos;ll tell you exactly
            which ones are needed
          </li>
          <li style={listItemStyle}>
            <strong>Review and submit</strong> — we compile everything into a
            DOJ-ready packet
          </li>
        </ol>
      </Section>

      <Section style={infoCardStyle}>
        <Text style={sectionHeadingStyle}>Helpful tips</Text>
        <ul style={tipListStyle}>
          <li style={listItemStyle}>
            You can save and return anytime — your progress is automatically
            saved
          </li>
          <li style={listItemStyle}>
            Not sure about a field? Skip it and come back later
          </li>
          <li style={listItemStyle}>
            The more complete your form, the stronger your claim
          </li>
        </ul>
        <Button href={portalUrl} style={primaryButtonStyle}>
          Continue your claim
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        We&apos;ll send occasional updates on your progress. Questions? Email
        support@radiantclaims.com
      </Text>
    </ClientEmailLayout>
  );
};

const heroCardStyle = {
  border: "1px solid #c7d2fe",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#eef2ff",
  textAlign: "center" as const,
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#4f46e5",
};

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#312e81",
  margin: "8px 0",
};

const bodyTextStyle = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
};

const infoCardStyle = {
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

const tipListStyle = {
  margin: "0 0 12px 18px",
  padding: 0,
  color: "#1f2937",
  fontSize: "15px",
  listStyleType: "disc" as const,
};

const listItemStyle = {
  marginBottom: "8px",
};

const primaryButtonStyle = {
  backgroundColor: "#4f46e5",
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

export default IntakeStartedEmail;
