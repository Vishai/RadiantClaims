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

interface DocumentValidatedEmailProps {
  name: string;
  resumeUrl: string;
}

export const DocumentValidatedEmail = ({
  name = "John Doe",
  resumeUrl = "http://localhost:3000/intake/step2?token=abc123",
}: DocumentValidatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Documents Validated - Next Steps - RadiantClaims</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>✅ Documents Validated</Heading>
            <Text style={tagline}>RadiantClaims</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Great News, {name}!
            </Heading>
            <Text style={text}>
              Our team has reviewed and validated your uploaded documents.
              Everything looks good and is ready for lawyer review!
            </Text>

            {/* Status Box */}
            <Section style={statusBox}>
              <Text style={statusTitle}>📋 Current Status</Text>
              <Hr style={divider} />
              <Text style={statusText}>
                <strong>✓ Documents Uploaded</strong> - Complete
                <br />
                <strong>✓ Initial Validation</strong> - Complete
                <br />
                <strong>→ Lawyer Review</strong> - In Progress
                <br />
                <strong>□ Ready to Submit</strong> - Coming Soon
              </Text>
            </Section>

            {/* What's Next */}
            <Section style={nextBox}>
              <Text style={nextTitle}>What Happens Next?</Text>
              <Text style={text}>
                Your documents are now going through a final lawyer review. This
                is a quick "rubber stamp" process to ensure everything is
                correct before you submit to DOJ (online or by mail).
              </Text>
              <Text style={text}>
                Once approved, we'll send you instructions for submitting to
                DOJ:
              </Text>
              <Text style={listText}>
                • A clear upload checklist for filing online (DOJ portal)
                <br />
                • Mail-in instructions (if you prefer mailing)
                <br />
                • Guidance on originals/certified copies (DOJ may request them
                later)
                <br />• Specific guidance for your jurisdiction
              </Text>
            </Section>

            {/* Action Needed */}
            <Section style={actionBox}>
              <Text style={actionTitle}>⏰ What You Can Do Now</Text>
              <Text style={actionText}>
                While waiting for final approval, you can gather any key
                originals or certified records you may need later. If you file
                online, DOJ allows you to upload scans, but they may request
                originals/certified copies to validate authenticity.
              </Text>
            </Section>

            {/* Continue Button */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={resumeUrl}>
                View Your Progress
              </Button>
            </Section>

            <Text style={text}>
              We'll notify you as soon as your packet is approved and ready to
              submit. Thank you for your patience!
            </Text>
            <Text style={signature}>- The RadiantClaims Team</Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This notification was sent regarding your RadiantClaims
              application.
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

export default DocumentValidatedEmail;

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
  backgroundColor: "#10b981", // emerald-500
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
  color: "#d1fae5", // emerald-200
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

const text = {
  color: "#323d34",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const statusBox = {
  backgroundColor: "#f0fdf4", // green-50
  border: "2px solid #bbf7d0", // green-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const statusTitle = {
  color: "#166534", // green-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const statusText = {
  color: "#15803d", // green-700
  fontSize: "14px",
  lineHeight: "2",
  margin: "0",
};

const nextBox = {
  margin: "24px 0",
};

const nextTitle = {
  color: "#323d34",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const listText = {
  color: "#323d34",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "12px 0",
  paddingLeft: "8px",
};

const actionBox = {
  backgroundColor: "#fef3c7", // amber-100
  border: "2px solid #fbbf24", // amber-400
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const actionTitle = {
  color: "#78350f", // amber-900
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const actionText = {
  color: "#92400e", // amber-800
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#10b981", // emerald-500
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
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
