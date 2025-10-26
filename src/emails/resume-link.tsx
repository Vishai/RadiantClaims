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

interface ResumeLinkEmailProps {
  name: string;
  resumeUrl: string;
  currentStep?: string;
  uploadedDocuments?: number;
  expiresAt?: string;
}

export const ResumeLinkEmail = ({
  name = "John Doe",
  resumeUrl = "http://localhost:3000/intake/step2?token=abc123",
  currentStep = "Document Upload",
  uploadedDocuments = 3,
  expiresAt = "7 days",
}: ResumeLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Resume Your RECA Claim - RadiantClaims</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>RadiantClaims</Heading>
            <Text style={tagline}>Continue Where You Left Off</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Hi {name},
            </Heading>
            <Text style={text}>
              We've saved your progress! You can continue your RECA claim
              application at any time using the secure link below.
            </Text>

            {/* Progress Summary */}
            <Section style={progressBox}>
              <Text style={progressTitle}>Your Progress</Text>
              <Hr style={divider} />
              <Text style={progressItem}>
                <strong>Current Step:</strong> {currentStep}
              </Text>
              <Text style={progressItem}>
                <strong>Documents Uploaded:</strong> {uploadedDocuments}
              </Text>
              {expiresAt && (
                <Text style={progressItem}>
                  <strong>Link Expires:</strong> {expiresAt}
                </Text>
              )}
            </Section>

            {/* Resume Button */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={resumeUrl}>
                Continue Your Claim
              </Button>
            </Section>

            {/* Important Reminders */}
            <Section style={remindersBox}>
              <Heading as="h3" style={h3}>
                📋 What You'll Need
              </Heading>
              <Text style={reminderText}>
                • Government-issued ID (driver's license or passport)
                <br />
                • Proof of residence from 1951-1962 (utility bills, school
                records, etc.)
                <br />
                • Medical documentation (pathology report, treatment records)
                <br />• Any additional supporting documents
              </Text>
            </Section>

            {/* Tips */}
            <Section style={tipsBox}>
              <Text style={tipsTitle}>💡 Helpful Tips</Text>
              <Text style={tipsText}>
                <strong>Take your time:</strong> You can save and return to your
                application as many times as you need.
              </Text>
              <Text style={tipsText}>
                <strong>Multiple documents:</strong> If you have several
                documents for one category, upload them all. More evidence is
                better!
              </Text>
              <Text style={tipsText}>
                <strong>Quality matters:</strong> Make sure all text in your
                documents is clear and readable.
              </Text>
            </Section>

            {/* Support */}
            <Text style={text}>
              Having trouble? Our support team is here to help you every step of
              the way.
            </Text>
            <Text style={signature}>
              - The RadiantClaims Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated email. Your progress is automatically saved
              as you work.
            </Text>
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

export default ResumeLinkEmail;

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
  backgroundColor: "#5f7262", // sage-500
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
  color: "#c7cfc8", // sage-200
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
  margin: "0 0 12px",
  padding: "0",
  lineHeight: "1.4",
};

const text = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const progressBox = {
  backgroundColor: "#f6f7f6", // sage-50
  border: "2px solid #c7cfc8", // sage-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const progressTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const progressItem = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "4px 0",
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
};

const remindersBox = {
  backgroundColor: "#fef8f5", // peach-50
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const reminderText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const tipsBox = {
  borderLeft: "4px solid #d4674f", // terracotta-500
  paddingLeft: "16px",
  margin: "24px 0",
};

const tipsTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const tipsText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const signature = {
  color: "#5f7262", // sage-500
  fontSize: "16px",
  fontStyle: "italic",
  margin: "24px 0 0",
};

const divider = {
  borderColor: "#e3e7e3", // sage-100
  margin: "16px 0",
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
