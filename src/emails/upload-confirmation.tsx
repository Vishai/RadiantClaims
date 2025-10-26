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

interface UploadConfirmationEmailProps {
  name: string;
  documentType: string;
  documentCount: number;
  totalUploaded: number;
  resumeUrl: string;
}

export const UploadConfirmationEmail = ({
  name = "John Doe",
  documentType = "Proof of Residence",
  documentCount = 1,
  totalUploaded = 5,
  resumeUrl = "http://localhost:3000/intake/step2?token=abc123",
}: UploadConfirmationEmailProps) => {
  const documentWord = documentCount === 1 ? "document" : "documents";

  return (
    <Html>
      <Head />
      <Preview>
        Document Received - {documentType} - RadiantClaims
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>✅ Document Received</Heading>
            <Text style={tagline}>RadiantClaims</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Hi {name},
            </Heading>
            <Text style={text}>
              Great news! We've successfully received your {documentType}{" "}
              {documentWord}.
            </Text>

            {/* Upload Summary */}
            <Section style={summaryBox}>
              <Text style={summaryTitle}>Upload Summary</Text>
              <Hr style={divider} />
              <Text style={summaryItem}>
                <strong>Document Type:</strong> {documentType}
              </Text>
              <Text style={summaryItem}>
                <strong>Files Uploaded:</strong> {documentCount} {documentWord}
              </Text>
              <Text style={summaryItem}>
                <strong>Total Documents:</strong> {totalUploaded} files
              </Text>
            </Section>

            {/* Success Message */}
            <Section style={successBox}>
              <Text style={successTitle}>🎉 You're Making Progress!</Text>
              <Text style={successText}>
                Your digital copies have been received and are being validated by our
                team. Once validated and approved by our lawyer, we'll send you clear
                instructions on which documents need certified copies/originals for
                final mailing to the DOJ.
              </Text>
            </Section>

            {/* Process Reminder */}
            <Section style={processBox}>
              <Text style={processTitle}>📬 How This Works</Text>
              <Text style={processText}>
                <strong>1. Upload digital copies</strong> (You're doing this now!)
                <br />
                <strong>2. We validate & review</strong> to ensure everything is correct
                <br />
                <strong>3. You mail originals</strong> using our prepaid envelope with
                instructions
                <br />
                <br />
                This process ensures your documents are complete before you obtain
                certified copies. It's more convenient for you!
              </Text>
            </Section>

            {/* Next Steps */}
            <Section style={nextStepsBox}>
              <Heading as="h3" style={h3}>
                What's Next?
              </Heading>
              <Text style={text}>
                Continue uploading any remaining documents to complete your claim
                packet. Here's what we typically need:
              </Text>
              <Text style={checklistText}>
                ✓ Government-issued ID
                <br />
                ✓ Proof of residence (1951-1962)
                <br />
                ✓ Medical documentation
                <br />✓ Additional supporting documents
              </Text>
            </Section>

            {/* Continue Button */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={resumeUrl}>
                Continue Uploading
              </Button>
            </Section>

            {/* Reminder */}
            <Section style={reminderBox}>
              <Text style={reminderText}>
                💡 <strong>Tip:</strong> You can upload documents from any
                device using your unique resume link. Your progress is
                automatically saved!
              </Text>
            </Section>

            <Text style={text}>
              If you have questions about which documents to upload, please don't
              hesitate to reach out.
            </Text>
            <Text style={signature}>
              - The RadiantClaims Team
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This confirmation was sent because documents were uploaded to your
              RadiantClaims account.
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

export default UploadConfirmationEmail;

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
  fontSize: "28px",
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

const successBox = {
  backgroundColor: "#f6f7f6", // sage-50
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  borderLeft: "4px solid #5f7262", // sage-500
};

const successTitle = {
  color: "#323d34", // sage-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const successText = {
  color: "#4a594d", // sage-600
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const processBox = {
  backgroundColor: "#eff6ff", // blue-50
  border: "2px solid #bfdbfe", // blue-200
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const processTitle = {
  color: "#1e40af", // blue-800
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const processText = {
  color: "#1e3a8a", // blue-900
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const nextStepsBox = {
  margin: "24px 0",
};

const checklistText = {
  color: "#323d34", // sage-800
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "12px 0",
  paddingLeft: "8px",
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

const reminderBox = {
  backgroundColor: "#fef8f5", // peach-50
  border: "1px solid #f9d9ca", // peach-200
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const reminderText = {
  color: "#783225", // peach-900
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
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
