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

interface PacketReadyEmailProps {
  name: string;
  claimType?: string;
  documentCount: number;
  packetUrl?: string;
  portalUrl: string;
}

export const PacketReadyEmail = ({
  name = "John Doe",
  claimType = "RECA Claim",
  documentCount = 12,
  packetUrl,
  portalUrl = "http://localhost:3000/portal",
}: PacketReadyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your RECA Claim Packet is Ready for Review - RadiantClaims
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 Packet Ready!</Heading>
            <Text style={tagline}>RadiantClaims</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Congratulations, {name}!
            </Heading>
            <Text style={text}>
              Your RECA claim packet has been successfully prepared and is now
              ready for review. Our team has compiled all your documents into a
              DOJ-ready submission packet.
            </Text>

            {/* Packet Summary */}
            <Section style={summaryBox}>
              <Text style={summaryTitle}>📦 Packet Summary</Text>
              <Hr style={divider} />
              <Text style={summaryItem}>
                <strong>Claim Type:</strong> {claimType}
              </Text>
              <Text style={summaryItem}>
                <strong>Total Documents:</strong> {documentCount} files
              </Text>
              <Text style={summaryItem}>
                <strong>Status:</strong> Ready for Review
              </Text>
              <Text style={summaryItem}>
                <strong>Prepared On:</strong>{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </Section>

            {/* Important Notice */}
            <Section style={importantBox}>
              <Text style={importantTitle}>⚠️ Important Next Steps</Text>
              <Hr style={divider} />
              <Text style={importantText}>
                <strong>1. Review Your Packet</strong>
                <br />
                Log in to your customer portal to review all included documents
                and ensure everything is accurate.
              </Text>
              <Text style={importantText}>
                <strong>2. Attorney Assignment</strong>
                <br />
                Your packet will be forwarded to our partner law firm for final
                review and DOJ submission.
              </Text>
              <Text style={importantText}>
                <strong>3. Track Your Progress</strong>
                <br />
                You'll receive updates as your claim moves through the
                submission process.
              </Text>
            </Section>

            {/* Action Buttons */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={portalUrl}>
                View Your Packet
              </Button>
              {packetUrl && (
                <>
                  <Text style={orText}>or</Text>
                  <Button style={secondaryButton} href={packetUrl}>
                    Download PDF
                  </Button>
                </>
              )}
            </Section>

            {/* What's Included */}
            <Section style={includeBox}>
              <Heading as="h3" style={h3}>
                📄 What's Included in Your Packet
              </Heading>
              <Text style={includeText}>
                ✓ Cover page with your claim information
                <br />
                ✓ Table of contents
                <br />
                ✓ Identity verification documents
                <br />
                ✓ Proof of residence (1951-1962 period)
                <br />
                ✓ Medical documentation
                <br />
                ✓ Signed consent and authorization forms
                <br />✓ All supporting documents
              </Text>
            </Section>

            {/* Timeline */}
            <Section style={timelineBox}>
              <Heading as="h3" style={h3}>
                ⏱️ What Happens Next
              </Heading>
              <Text style={timelineText}>
                <strong>Within 2-3 business days:</strong> Attorney review
                begins
              </Text>
              <Text style={timelineText}>
                <strong>Within 1-2 weeks:</strong> Submission to DOJ (if
                approved)
              </Text>
              <Text style={timelineText}>
                <strong>6-12 months:</strong> DOJ review process (typical
                timeline)
              </Text>
              <Text style={timelineNote}>
                Note: Timelines may vary depending on case complexity and DOJ
                processing times.
              </Text>
            </Section>

            {/* Support */}
            <Text style={text}>
              If you notice any errors or need to update information, please
              contact us immediately. We're here to ensure your claim has the
              best chance of approval.
            </Text>
            <Text style={signature}>
              Thank you for trusting RadiantClaims with your RECA claim.
              <br />- The RadiantClaims Team
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

export default PacketReadyEmail;

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

const summaryBox = {
  backgroundColor: "#f6f7f6", // sage-50
  border: "2px solid #c7cfc8", // sage-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const summaryTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const summaryItem = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "4px 0",
};

const importantBox = {
  backgroundColor: "#fef8f5", // peach-50
  border: "2px solid #ed9472", // peach-400
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const importantTitle = {
  color: "#b1412a", // peach-700
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const importantText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
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

const includeBox = {
  margin: "24px 0",
  paddingLeft: "16px",
  borderLeft: "4px solid #5f7262", // sage-500
};

const includeText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const timelineBox = {
  backgroundColor: "#f6f7f6", // sage-50
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const timelineText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const timelineNote = {
  color: "#7a8c7e", // sage-400
  fontSize: "12px",
  fontStyle: "italic",
  lineHeight: "1.5",
  margin: "12px 0 0",
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
