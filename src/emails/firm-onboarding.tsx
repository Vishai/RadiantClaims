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
import * as React from "react";

interface FirmOnboardingEmailProps {
  firmName: string;
  contactName: string;
  attorneyEmail: string;
  attorneyPassword: string;
  demoEmail: string;
  demoPassword: string;
  loginUrl: string;
}

export const FirmOnboardingEmail = ({
  firmName = "Heritage Law Offices",
  contactName = "Ryan",
  attorneyEmail = "ryan.heritagelaw@gmail.com",
  attorneyPassword = "TempPassword123!",
  demoEmail = "demo@heritagelaw.com",
  demoPassword = "DemoAccess2025!",
  loginUrl = "https://radiantclaims.com/login",
}: FirmOnboardingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to RadiantClaims - Your Partnership Portal Access & Working
        Agreement
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to RadiantClaims!</Heading>

          <Text style={text}>Dear {contactName},</Text>

          <Text style={text}>
            I'm excited to begin our partnership with {firmName}! This email
            contains everything you need to get started:
          </Text>

          <Section style={sectionBorder}>
            <Heading style={h2}>📋 Working Agreement</Heading>
            <Text style={text}>
              Please find attached our Working Agreement between Heritage Law
              Offices and 0tomait LLC d/b/a RadiantClaims. Please review at your
              convenience and let me know if you have any questions.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={sectionBorder}>
            <Heading style={h2}>🔐 Your Attorney Portal Access</Heading>
            <Text style={text}>
              These are your <strong>personal attorney credentials</strong> with
              full access to case management, packet review, and attorney
              features:
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialLabel}>Email:</Text>
              <Text style={credentialValue}>{attorneyEmail}</Text>

              <Text style={credentialLabel}>Temporary Password:</Text>
              <Text style={credentialValue}>{attorneyPassword}</Text>

              <Text style={warningText}>
                ⚠️ <strong>Important:</strong> You will be required to change
                this password on your first login for security.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={sectionBorder}>
            <Heading style={h2}>🎯 Demo Account for Your Team</Heading>
            <Text style={text}>
              I've also created a <strong>demo account</strong> that you can
              share with your team to explore the platform, review the user
              experience, and provide feedback on design and functionality:
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialLabel}>Email:</Text>
              <Text style={credentialValue}>{demoEmail}</Text>

              <Text style={credentialLabel}>Password:</Text>
              <Text style={credentialValue}>{demoPassword}</Text>

              <Text style={infoText}>
                ℹ️ This account does not require a password change and can be
                shared with your team for exploration and feedback.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={ctaSection}>
            <Text style={text}>
              <strong>Ready to get started?</strong>
            </Text>
            <Link href={loginUrl} style={button}>
              Access Your Portal
            </Link>
          </Section>

          <Hr style={hr} />

          <Section style={sectionBorder}>
            <Heading style={h2}>📝 Next Steps</Heading>
            <Text style={listItem}>
              1. <strong>Review the Working Agreement</strong> and reach out
              with any questions
            </Text>
            <Text style={listItem}>
              2. <strong>Log in with your attorney credentials</strong> and
              change your password
            </Text>
            <Text style={listItem}>
              3. <strong>Explore the demo account</strong> with your team and
              provide feedback
            </Text>
            <Text style={listItem}>
              4. <strong>Schedule a walkthrough call</strong> - I'll be happy to
              guide you through the platform
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            I'm here to support you every step of the way. If you have any
            questions or need assistance, please don't hesitate to reach out.
          </Text>

          <Text style={text}>
            Looking forward to our partnership!
            <br />
            <br />
            Best regards,
            <br />
            <strong>Brandon Armstrong</strong>
            <br />
            0tomait LLC d/b/a RadiantClaims
            <br />
            <Link href="mailto:brandon@radiantclaims.com" style={link}>
              brandon@radiantclaims.com
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email contains sensitive login credentials. Please store them
            securely and do not forward this email. If you did not expect this
            email, please contact me immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default FirmOnboardingEmail;

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
  color: "#2d5f4f",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#2d5f4f",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const listItem = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "28px",
  padding: "0 40px",
  margin: "8px 0",
};

const sectionBorder = {
  padding: "0 40px",
};

const credentialsBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "16px 40px",
};

const credentialLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "12px 0 4px",
  textTransform: "uppercase" as const,
};

const credentialValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  fontFamily: "monospace",
  margin: "0 0 16px",
};

const warningText = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fbbf24",
  borderRadius: "6px",
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  padding: "12px",
  margin: "16px 0 0",
};

const infoText = {
  backgroundColor: "#dbeafe",
  border: "1px solid #60a5fa",
  borderRadius: "6px",
  color: "#1e40af",
  fontSize: "14px",
  lineHeight: "20px",
  padding: "12px",
  margin: "16px 0 0",
};

const ctaSection = {
  padding: "0 40px",
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#c47b5e",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  margin: "16px 0",
};

const link = {
  color: "#c47b5e",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  padding: "0 40px",
  textAlign: "center" as const,
  fontStyle: "italic",
};
