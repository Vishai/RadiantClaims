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

interface PasswordChangedEmailProps {
  name: string;
  timestamp: string;
  loginUrl: string;
}

export default function PasswordChangedEmail({
  name = "Attorney",
  timestamp = new Date().toLocaleString(),
  loginUrl = "https://radiantclaims.com/login",
}: PasswordChangedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your RadiantClaims Password Has Been Changed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>✅ Password Successfully Changed</Heading>

          <Text style={text}>Hello {name},</Text>

          <Text style={text}>
            Your RadiantClaims password has been successfully changed. Your
            account is now secured with your new password.
          </Text>

          <Section style={successBox}>
            <Text style={successText}>
              <strong>Password Changed At:</strong>
            </Text>
            <Text style={successText}>{timestamp}</Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            What This Means
          </Heading>

          <Text style={text}>
            ✓ Your account is now secured with your new password
            <br />
            ✓ You can log in using your new credentials
            <br />
            ✓ Your old temporary password is no longer valid
            <br />✓ All active sessions remain logged in
          </Text>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Access Your Account
            </Link>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Didn't Make This Change?
          </Heading>

          <Section style={warningBox}>
            <Text style={warningText}>
              <strong>⚠️ Security Alert</strong>
            </Text>
            <Text style={warningText}>
              If you did not change your password, your account may be
              compromised. Please contact our security team immediately:
            </Text>
            <Text style={warningText}>
              <strong>Email:</strong> security@radiantclaims.com
            </Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Account Security Tips
          </Heading>

          <ul style={list}>
            <li>Keep your password private and never share it</li>
            <li>Use a unique password that you don't use elsewhere</li>
            <li>Consider using a password manager</li>
            <li>Log out when using shared computers</li>
            <li>Watch for suspicious login attempts or emails</li>
          </ul>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for keeping your RadiantClaims account secure.
          </Text>

          <Text style={footer}>
            <strong>RadiantClaims Security Team</strong>
            <br />
            Protecting your data and your clients' privacy
          </Text>

          <Hr style={hr} />

          <Text style={footerSmall}>
            This is an automated security notification sent to all account
            holders when their password is changed. You cannot unsubscribe from
            security emails.
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

const successBox = {
  backgroundColor: "#d1fae5",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
  border: "1px solid #10b981",
};

const successText = {
  fontSize: "16px",
  margin: "8px 0",
  color: "#065f46",
};

const warningBox = {
  backgroundColor: "#fee2e2",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
  border: "1px solid #ef4444",
};

const warningText = {
  fontSize: "16px",
  margin: "8px 0",
  color: "#991b1b",
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
