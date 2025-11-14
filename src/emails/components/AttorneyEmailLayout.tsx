import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface AttorneyEmailLayoutProps {
  previewText?: string;
  heading?: string;
  subheading?: string;
  dashboardUrl?: string;
  settingsUrl?: string;
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function AttorneyEmailLayout({
  previewText,
  heading = "RadiantClaims Attorney Portal",
  subheading = "Actionable notifications tailored to your firm",
  dashboardUrl = "https://app.radiantclaims.com/attorney/dashboard",
  settingsUrl = "https://app.radiantclaims.com/attorney/settings",
  unsubscribeUrl,
  children,
}: AttorneyEmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={eyebrowStyle}>RadiantClaims</Text>
            <Text style={headingStyle}>{heading}</Text>
            <Text style={subheadingStyle}>{subheading}</Text>
          </Section>

          {children}

          <Hr style={dividerStyle} />

          <Section style={footerStyle}>
            <Text style={footerHeadingStyle}>Quick Links</Text>
            <Link href={dashboardUrl} style={linkStyle}>
              Attorney Dashboard
            </Link>
            <Link href={settingsUrl} style={linkStyle}>
              Notification Settings
            </Link>
            {unsubscribeUrl ? (
              <Link href={unsubscribeUrl} style={linkStyle}>
                Unsubscribe
              </Link>
            ) : null}
            <Text style={finePrintStyle}>
              You are receiving this email because your firm enabled
              RadiantClaims notifications. You can update preferences any time.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f6f7f9",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const containerStyle = {
  maxWidth: "640px",
  margin: "32px auto",
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
};

const headerStyle = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const eyebrowStyle = {
  color: "#6366f1",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "8px",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "4px",
};

const subheadingStyle = {
  fontSize: "15px",
  color: "#475569",
};

const dividerStyle = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footerStyle = {
  textAlign: "center" as const,
};

const footerHeadingStyle = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "8px",
};

const linkStyle = {
  display: "inline-block",
  margin: "4px 12px",
  color: "#4f46e5",
  fontSize: "14px",
  textDecoration: "none",
};

const finePrintStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "12px",
};

export default AttorneyEmailLayout;
