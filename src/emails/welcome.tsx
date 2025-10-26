import {
  Body,
  Button,
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

interface WelcomeEmailProps {
  name: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  resumeUrl?: string;
}

export const WelcomeEmail = ({
  name = "John Doe",
  email = "john@example.com",
  temporaryPassword = "temp123456",
  loginUrl = "http://localhost:3000/login",
  resumeUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to RadiantClaims - Your Account is Ready</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>RadiantClaims</Heading>
            <Text style={tagline}>RECA Claim Preparation Made Simple</Text>
          </Section>

          {/* Welcome Message */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Welcome, {name}!
            </Heading>
            <Text style={text}>
              Your RadiantClaims account has been created successfully. We're
              here to help you prepare your RECA claim packet at no cost to you.
            </Text>

            {/* Credentials Box */}
            <Section style={credentialsBox}>
              <Text style={credentialsTitle}>Your Login Credentials</Text>
              <Hr style={divider} />
              <Text style={credentialItem}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={credentialItem}>
                <strong>Temporary Password:</strong> {temporaryPassword}
              </Text>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              {resumeUrl ? (
                <>
                  <Button style={primaryButton} href={resumeUrl}>
                    Continue Your Claim
                  </Button>
                  <Text style={orText}>or</Text>
                  <Button style={secondaryButton} href={loginUrl}>
                    Login to Your Account
                  </Button>
                </>
              ) : (
                <Button style={primaryButton} href={loginUrl}>
                  Login to Your Account
                </Button>
              )}
            </Section>

            {/* Important Notice */}
            <Section style={noticeBox}>
              <Text style={noticeTitle}>⚠️ Important</Text>
              <Text style={noticeText}>
                Please change your password after logging in for the first time.
                You can do this from your account settings in the customer
                portal.
              </Text>
            </Section>

            {/* Next Steps */}
            <Section style={nextSteps}>
              <Heading as="h3" style={h3}>
                What's Next?
              </Heading>
              <Text style={text}>
                1. Log in using your credentials above
                <br />
                2. Complete your document upload
                <br />
                3. Review and sign consent forms
                <br />
                4. We'll prepare your DOJ-ready packet
              </Text>
            </Section>

            {/* Support */}
            <Text style={text}>
              If you have any questions or need assistance, please don't
              hesitate to reach out to our support team.
            </Text>
            <Text style={signature}>
              - The RadiantClaims Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} RadiantClaims. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Unsubscribe
              </Link>
              {" · "}
              <Link href="mailto:support@radiantclaims.com" style={footerLink}>
                Contact Support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: "#fdfcfb", // cream-50
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const header = {
  backgroundColor: "#d4674f", // terracotta-500
  padding: "32px 24px",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0 0 8px",
  padding: "0",
  lineHeight: "1.2",
};

const tagline = {
  color: "#fae8e1", // terracotta-100
  fontSize: "14px",
  margin: "0",
  padding: "0",
};

const content = {
  backgroundColor: "#ffffff",
  padding: "32px 24px",
  borderRadius: "0 0 8px 8px",
};

const h2 = {
  color: "#323d34", // sage-800
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 16px",
  padding: "0",
  lineHeight: "1.3",
};

const h3 = {
  color: "#323d34", // sage-800
  fontSize: "18px",
  fontWeight: "600",
  margin: "24px 0 12px",
  padding: "0",
  lineHeight: "1.4",
};

const text = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const credentialsBox = {
  backgroundColor: "#f6f7f6", // sage-50
  border: "2px solid #c7cfc8", // sage-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const credentialsTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const credentialItem = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "4px 0",
  fontFamily: "monospace",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#d4674f", // terracotta-500
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  margin: "8px 0",
};

const secondaryButton = {
  backgroundColor: "#5f7262", // sage-500
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  margin: "8px 0",
};

const orText = {
  color: "#7a8c7e", // sage-400
  fontSize: "14px",
  margin: "8px 0",
  textAlign: "center" as const,
};

const noticeBox = {
  backgroundColor: "#fef8f5", // peach-50
  border: "1px solid #f9d9ca", // peach-200
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const noticeTitle = {
  color: "#b1412a", // peach-700
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const noticeText = {
  color: "#783225", // peach-900
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const nextSteps = {
  margin: "24px 0",
};

const signature = {
  color: "#5f7262", // sage-500
  fontSize: "16px",
  fontStyle: "italic",
  margin: "24px 0 0",
};

const divider = {
  borderColor: "#e3e7e3", // sage-100
  margin: "24px 0",
};

const footer = {
  padding: "0 24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#7a8c7e", // sage-400
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "8px 0",
};

const footerLink = {
  color: "#5f7262", // sage-500
  textDecoration: "underline",
};
