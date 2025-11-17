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

export interface ClientEmailLayoutProps {
  previewText?: string;
  headline?: string;
  portalUrl?: string;
  unsubscribeUrl?: string;
  children: React.ReactNode;
}

export function ClientEmailLayout({
  previewText,
  headline = "Your RECA Claim Progress",
  portalUrl = "https://app.radiantclaims.com/portal",
  unsubscribeUrl,
  children,
}: ClientEmailLayoutProps) {
  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={eyebrowStyle}>RadiantClaims</Text>
            <Text style={headlineStyle}>{headline}</Text>
          </Section>

          {children}

          <Hr style={dividerStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Need help? Our support team is standing by Monday–Saturday.
            </Text>
            <Link href={portalUrl} style={ctaLinkStyle}>
              Open Client Portal
            </Link>
            {unsubscribeUrl ? (
              <Link href={unsubscribeUrl} style={secondaryLinkStyle}>
                Manage notifications
              </Link>
            ) : null}
            <Text style={finePrintStyle}>
              This message was sent to keep your RECA claim moving forward.
              Manage notifications in your client portal.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const containerStyle = {
  maxWidth: "640px",
  margin: "24px auto",
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
};

const headerStyle = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const eyebrowStyle = {
  color: "#d4674f",
  fontSize: "13px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

const headlineStyle = {
  fontSize: "24px",
  marginTop: "6px",
  color: "#0f172a",
  fontWeight: 600,
};

const dividerStyle = {
  borderColor: "#f5d1c4",
  margin: "24px 0",
};

const footerStyle = {
  textAlign: "center" as const,
};

const footerTextStyle = {
  fontSize: "14px",
  color: "#475569",
  marginBottom: "8px",
};

const ctaLinkStyle = {
  display: "inline-block",
  marginTop: "4px",
  fontSize: "15px",
  color: "#d4674f",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryLinkStyle = {
  display: "block",
  marginTop: "6px",
  fontSize: "13px",
  color: "#7a8c7e",
  textDecoration: "none",
};

const finePrintStyle = {
  marginTop: "12px",
  fontSize: "12px",
  color: "#94a3b8",
};

export default ClientEmailLayout;
