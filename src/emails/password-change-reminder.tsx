import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordChangeReminderEmailProps {
  name: string;
  changePasswordUrl: string;
}

export default function PasswordChangeReminderEmail({
  name = "Attorney",
  changePasswordUrl = "https://radiantclaims.com/portal/change-password",
}: PasswordChangeReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Security Reminder: Update Your RadiantClaims Password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔒 Security Reminder</Heading>

          <Text style={text}>Hello {name},</Text>

          <Text style={text}>
            This is a friendly reminder to change your temporary password on
            RadiantClaims. Updating your password is an important security step
            to protect your attorney account and your clients' sensitive
            information.
          </Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              <strong>⚠️ Action Required</strong>
            </Text>
            <Text style={warningText}>
              For security reasons, you should change your temporary password as
              soon as possible.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link href={changePasswordUrl} style={button}>
              Change Your Password Now
            </Link>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Password Requirements
          </Heading>

          <Text style={text}>
            Your new password must meet the following requirements:
          </Text>

          <ul style={list}>
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter (A-Z)</li>
            <li>Contains at least one lowercase letter (a-z)</li>
            <li>Contains at least one number (0-9)</li>
          </ul>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            How to Change Your Password
          </Heading>

          <Text style={text}>
            <strong>Step 1:</strong> Log in to RadiantClaims with your current
            credentials
          </Text>

          <Text style={text}>
            <strong>Step 2:</strong> Navigate to the password change page (or
            click the button above)
          </Text>

          <Text style={text}>
            <strong>Step 3:</strong> Enter your current password and create a
            new secure password
          </Text>

          <Text style={text}>
            <strong>Step 4:</strong> Confirm your new password and save
          </Text>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Password Security Tips
          </Heading>

          <ul style={list}>
            <li>Use a unique password that you don't use on other websites</li>
            <li>Consider using a passphrase (e.g., "BlueSky!Coffee2025")</li>
            <li>Use a password manager to securely store your credentials</li>
            <li>Never share your password via email or text message</li>
            <li>Enable two-factor authentication if available</li>
          </ul>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions or need assistance changing your password,
            please don't hesitate to reach out to our support team.
          </Text>

          <Text style={footer}>
            <strong>RadiantClaims Security Team</strong>
            <br />
            Protecting your data and your clients' privacy
          </Text>

          <Hr style={hr} />

          <Text style={footerSmall}>
            This is an automated security reminder. If you've already changed
            your password, you can safely ignore this message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1d3f34",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const h2 = {
  color: "#1d3f34",
  fontSize: "24px",
  fontWeight: "600",
  margin: "24px 0 16px",
  padding: "0 40px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "16px 0",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
  border: "1px solid #fbbf24",
};

const warningText = {
  fontSize: "16px",
  margin: "8px 0",
  color: "#92400e",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#c56e56",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px",
};

const list = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 40px",
  margin: "8px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 40px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "20px",
  padding: "0 40px",
  margin: "16px 0",
};

const footerSmall = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  margin: "8px 0",
};
