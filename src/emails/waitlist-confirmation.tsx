import { Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "./components/ClientEmailLayout";

export interface WaitlistConfirmationEmailProps {
  name?: string;
  email?: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export const WaitlistConfirmationEmail = ({
  name,
  email = "you",
  previewText = "You're on the list — we'll notify you when registration opens.",
  unsubscribeUrl,
}: WaitlistConfirmationEmailProps) => {
  const greeting = name ? `${name}, you're` : "You're";

  return (
    <ClientEmailLayout
      previewText={previewText}
      headline="Waitlist Confirmed"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroCardStyle}>
        <Heading as="h2" style={heroHeadingStyle}>
          {greeting} on the list
        </Heading>
        <Text style={bodyTextStyle}>
          We received your request to join RadiantClaims. As soon as
          registration opens, you&apos;ll be among the first to know.
        </Text>
      </Section>

      <Section style={infoCardStyle}>
        <Text style={sectionHeadingStyle}>What happens next?</Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            We&apos;ll email <strong>{email}</strong> the moment registration
            opens
          </li>
          <li style={listItemStyle}>
            You&apos;ll get priority access to start your RECA claim
          </li>
          <li style={listItemStyle}>No action needed from you until then</li>
        </ul>
      </Section>

      <Section style={infoCardStyle}>
        <Text style={sectionHeadingStyle}>While you wait</Text>
        <Text style={bodyTextStyle}>
          The Radiation Exposure Compensation Act provides compensation for
          individuals exposed to radiation from nuclear testing and uranium
          mining. Gathering your documents early can speed up the process once
          you start.
        </Text>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Questions? Reply to this email or contact us at
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

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#166534",
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
  margin: "0 0 0 18px",
  padding: 0,
  color: "#1f2937",
  fontSize: "15px",
};

const listItemStyle = {
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

export default WaitlistConfirmationEmail;
