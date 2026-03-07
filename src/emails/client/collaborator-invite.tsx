import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface CollaboratorInviteEmailProps {
  previewText?: string;
  inviterName?: string;
  acceptUrl: string;
  supportEmail?: string;
}

export const ClientCollaboratorInviteEmail = ({
  previewText = "You’ve been invited to help upload documents for a RECA claim.",
  inviterName,
  acceptUrl,
  supportEmail = "support@radiantclaims.com",
}: CollaboratorInviteEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={acceptUrl}
      headline="Family upload invite"
    >
      <Section style={sectionStyle}>
        <Heading as="h2" style={headingStyle}>
          You’ve been invited to help
        </Heading>
        <Text style={textStyle}>
          {inviterName
            ? `${inviterName} invited you to help with a RECA claim in RadiantClaims.`
            : "A family member invited you to help with a RECA claim in RadiantClaims."}
        </Text>
        <Text style={textStyle}>
          This secure link opens a contributor workspace where you can provide
          your details and upload only the supporting documents that apply to
          you.
        </Text>
      </Section>

      <Section style={buttonSectionStyle}>
        <Button href={acceptUrl} style={primaryButtonStyle}>
          Accept invite
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      <Text style={metaTextStyle}>
        If you weren’t expecting this, you can ignore this email. Need help?
        Email {supportEmail}.
      </Text>
    </ClientEmailLayout>
  );
};

const sectionStyle = {
  padding: "16px 0",
};

const headingStyle = {
  fontSize: "20px",
  color: "#0f172a",
  marginBottom: "6px",
};

const textStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const buttonSectionStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "12px",
};

const primaryButtonStyle = {
  backgroundColor: "#0284c7",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  textAlign: "center" as const,
};

const dividerStyle = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const metaTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
};

export default ClientCollaboratorInviteEmail;
