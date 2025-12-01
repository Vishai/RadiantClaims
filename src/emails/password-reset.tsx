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

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  expiresText: string;
}

export default function PasswordResetEmail({
  name = "User",
  resetUrl = "https://radiantclaims.com/reset-password",
  expiresText = "30 minutes",
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset Your RadiantClaims Password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔒 Reset Your Password</Heading>

          <Text style={text}>Hello {name},</Text>

          <Text style={text}>
            We received a request to reset the password for your RadiantClaims
            account. If you didn't make this request, you can safely ignore this
            email.
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>

          <Text style={text}>This link will expire in {expiresText}.</Text>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            Security Tips
          </Heading>

          <Text style={text}>
            • Never share your password with anyone.
            <br />• Use a strong, unique password.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            <strong>RadiantClaims Security Team</strong>
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
