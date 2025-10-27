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

interface ReadyToMailEmailProps {
  name: string;
  trackingNumber?: string;
  dojAddress: string;
  portalUrl: string;
}

export const ReadyToMailEmail = ({
  name = "John Doe",
  trackingNumber = "9400 1234 5678 9999 9999 99",
  dojAddress = "Department of Justice\nRadiation Exposure Compensation Program\n1425 New York Avenue, NW\nWashington, DC 20530",
  portalUrl = "http://localhost:3000/portal",
}: ReadyToMailEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Ready to Mail - Final Instructions - RadiantClaims
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>📬 Ready to Mail!</Heading>
            <Text style={tagline}>RadiantClaims</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Congratulations, {name}!
            </Heading>
            <Text style={text}>
              Your documents have been validated and approved by our lawyer. Your
              claim packet is now ready for final submission to the Department of
              Justice!
            </Text>

            {/* Success Box */}
            <Section style={successBox}>
              <Text style={successTitle}>🎉 All Steps Complete!</Text>
              <Text style={successText}>
                <strong>✓ Documents Uploaded</strong>
                <br />
                <strong>✓ Validated by Our Team</strong>
                <br />
                <strong>✓ Approved by Lawyer</strong>
                <br />
                <strong>✓ Ready for DOJ Submission</strong>
              </Text>
            </Section>

            {/* Mailing Instructions */}
            <Section style={instructionsBox}>
              <Heading as="h3" style={h3}>
                📋 Mailing Instructions
              </Heading>
              <Text style={text}>
                <strong>Your prepaid envelope is on its way!</strong> We've mailed you a
                prepaid envelope with printed copies of your documents and an
                instruction slip. Here's what to do when you receive it:
              </Text>

              {/* Step by Step */}
              <Section style={stepBox}>
                <Text style={stepNumber}>STEP 1</Text>
                <Text style={stepTitle}>Gather Required Originals/Certified Copies</Text>
                <Text style={stepText}>
                  Review the instruction slip in your envelope. It lists which
                  documents need to be replaced with certified copies or originals
                  (marked with a ⚠️ symbol).
                </Text>
              </Section>

              <Section style={stepBox}>
                <Text style={stepNumber}>STEP 2</Text>
                <Text style={stepTitle}>Replace Printed Copies</Text>
                <Text style={stepText}>
                  Remove our printed copies for documents that require originals.
                  Replace them with your actual certified copies or original documents.
                  Keep documents that accept copies as-is.
                </Text>
              </Section>

              <Section style={stepBox}>
                <Text style={stepNumber}>STEP 3</Text>
                <Text style={stepTitle}>Include the Instruction Slip</Text>
                <Text style={stepText}>
                  Place the instruction slip we provided on top of your document stack.
                  This helps the DOJ process your claim correctly.
                </Text>
              </Section>

              <Section style={stepBox}>
                <Text style={stepNumber}>STEP 4</Text>
                <Text style={stepTitle}>Seal & Mail</Text>
                <Text style={stepText}>
                  Seal the prepaid envelope and drop it in any USPS mailbox or take it
                  to your local post office. No postage needed!
                </Text>
              </Section>
            </Section>

            {/* Tracking Info */}
            {trackingNumber && (
              <Section style={trackingBox}>
                <Text style={trackingTitle}>📦 Tracking Information</Text>
                <Hr style={divider} />
                <Text style={trackingText}>
                  <strong>Prepaid Envelope Tracking:</strong>
                  <br />
                  {trackingNumber}
                  <br />
                  <br />
                  <Link href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber.replace(/\s/g, '')}`} style={link}>
                    Track Your Envelope →
                  </Link>
                </Text>
              </Section>
            )}

            {/* Important Notes */}
            <Section style={notesBox}>
              <Text style={notesTitle}>⚠️ Important Notes</Text>
              <Text style={notesText}>
                • <strong>Keep copies:</strong> Make copies of everything before
                mailing (especially originals)
                <br />
                • <strong>Certified copies:</strong> Medical records and government IDs
                must be certified by the issuing institution
                <br />
                • <strong>Historical docs:</strong> Original residence documents from
                1951-1962 are preferred but copies acceptable if originals unavailable
                <br />
                • <strong>Timing:</strong> Mail within 30 days to ensure timely
                processing
              </Text>
            </Section>

            {/* DOJ Address */}
            <Section style={addressBox}>
              <Text style={addressTitle}>Mailing To:</Text>
              <Text style={addressText}>
                {dojAddress.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < dojAddress.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </Text>
            </Section>

            {/* Portal Button */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={portalUrl}>
                View Your Portal
              </Button>
            </Section>

            {/* Support */}
            <Section style={supportBox}>
              <Text style={supportTitle}>Need Help?</Text>
              <Text style={supportText}>
                If you have questions about which documents need originals, need help
                obtaining certified copies, or have any other questions, please don't
                hesitate to contact us. We're here to help!
              </Text>
            </Section>

            <Text style={text}>
              Thank you for trusting RadiantClaims with your RECA claim. We wish you
              the best in your pursuit of compensation!
            </Text>
            <Text style={signature}>
              - The RadiantClaims Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This notification was sent regarding your RadiantClaims application.
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

export default ReadyToMailEmail;

// Styles
const main = {
  backgroundColor: "#fdfcfb",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const header = {
  backgroundColor: "#3b82f6", // blue-500
  padding: "32px 24px",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 8px",
  padding: "0",
  lineHeight: "1.2",
};

const tagline = {
  color: "#dbeafe", // blue-200
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
  color: "#323d34",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 16px",
  padding: "0",
  lineHeight: "1.3",
};

const h3 = {
  color: "#323d34",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 16px",
  padding: "0",
  lineHeight: "1.4",
};

const text = {
  color: "#323d34",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const successBox = {
  backgroundColor: "#f0fdf4", // green-50
  border: "2px solid #86efac", // green-300
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const successTitle = {
  color: "#166534", // green-800
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const successText = {
  color: "#15803d", // green-700
  fontSize: "14px",
  lineHeight: "2",
  margin: "0",
};

const instructionsBox = {
  margin: "32px 0",
};

const stepBox = {
  backgroundColor: "#eff6ff", // blue-50
  border: "1px solid #bfdbfe", // blue-200
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const stepNumber = {
  display: "inline-block",
  backgroundColor: "#3b82f6", // blue-500
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "700",
  padding: "4px 12px",
  borderRadius: "12px",
  margin: "0 0 8px",
};

const stepTitle = {
  color: "#1e40af", // blue-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "8px 0",
};

const stepText = {
  color: "#1e3a8a", // blue-900
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const trackingBox = {
  backgroundColor: "#f9fafb", // gray-50
  border: "2px solid #e5e7eb", // gray-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const trackingTitle = {
  color: "#1f2937", // gray-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const trackingText = {
  color: "#374151", // gray-700
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const notesBox = {
  backgroundColor: "#fef3c7", // amber-100
  border: "2px solid #fbbf24", // amber-400
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const notesTitle = {
  color: "#78350f", // amber-900
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const notesText = {
  color: "#92400e", // amber-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const addressBox = {
  backgroundColor: "#f3f4f6", // gray-100
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const addressTitle = {
  color: "#374151", // gray-700
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const addressText = {
  color: "#1f2937", // gray-800
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0",
  fontFamily: "monospace",
};

const supportBox = {
  backgroundColor: "#f6f7f6", // sage-50
  borderLeft: "4px solid #5f7262", // sage-500
  padding: "20px",
  margin: "32px 0",
};

const supportTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const supportText = {
  color: "#4a594d", // sage-600
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#3b82f6", // blue-500
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const link = {
  color: "#3b82f6", // blue-500
  textDecoration: "underline",
  fontSize: "14px",
};

const signature = {
  color: "#5f7262",
  fontSize: "16px",
  fontStyle: "italic",
  margin: "24px 0 0",
};

const divider = {
  borderColor: "#e3e7e3",
  margin: "16px 0",
};

const footer = {
  padding: "0 24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#7a8c7e",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "8px 0",
};

const footerLink = {
  color: "#5f7262",
  textDecoration: "underline",
};
