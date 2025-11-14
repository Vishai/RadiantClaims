import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface ReengagementEmailProps {
  previewText?: string;
  claimantName?: string;
  daysInactive?: number;
  priorityScore?: number;
  recommendedAction?: string;
  supportSlots?: string[];
  portalUrl?: string;
  assistanceUrl?: string;
  unsubscribeUrl?: string;
}

const defaultSupportSlots = [
  "Today · 2:00 PM Mountain",
  "Tomorrow · 10:00 AM Mountain",
  "Tomorrow · 4:30 PM Mountain",
];

export const ClientReengagementEmail = ({
  previewText = "Need a hand getting unstuck? Let’s finish your RECA packet together.",
  claimantName = "Mary",
  daysInactive = 12,
  priorityScore = 68,
  recommendedAction = "Schedule a 15-minute check-in so we can upload any remaining files together.",
  supportSlots = defaultSupportSlots,
  portalUrl = "https://app.radiantclaims.com/portal",
  assistanceUrl = "https://app.radiantclaims.com/portal/support",
  unsubscribeUrl,
}: ReengagementEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={portalUrl}
      headline="We’re here to help"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Still with us, {claimantName}?
        </Heading>
        <Text style={mutedTextStyle}>
          We noticed there hasn’t been activity in {daysInactive} days.
          That&apos;s totally normal—life happens—but we don’t want your claim
          to stall.
        </Text>
        <Text style={mutedTextStyle}>{recommendedAction}</Text>
      </Section>

      <Section style={priorityCardStyle}>
        <Text style={eyebrowStyle}>Priority Score</Text>
        <Text style={priorityValueStyle}>{priorityScore}</Text>
        <Text style={mutedTextStyleSmall}>
          Higher scores mean we’ll keep nudging you so deadlines aren’t missed.
        </Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Pick a time that works</Text>
        <ul style={listStyle}>
          {supportSlots.map((slot) => (
            <li key={slot} style={listItemStyle}>
              {slot}
            </li>
          ))}
        </ul>
        <Text style={mutedTextStyle}>
          Book a session and we’ll walk you through uploads, forms, or anything
          else needed.
        </Text>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button href={assistanceUrl} style={primaryButtonStyle}>
          Schedule help
        </Button>
        <Button href={portalUrl} style={secondaryButtonStyle}>
          I’ll handle it now
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Prefer fewer reminders? You can pause follow-ups from the notification
        settings page in your portal.
      </Text>
    </ClientEmailLayout>
  );
};

const cardSectionStyle = {
  padding: "16px 0",
};

const cardHeadingStyle = {
  fontSize: "20px",
  color: "#0f172a",
  marginBottom: "8px",
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const mutedTextStyleSmall = {
  color: "#475569",
  fontSize: "14px",
};

const priorityCardStyle = {
  border: "1px solid #fbcfe8",
  borderRadius: "16px",
  padding: "18px",
  backgroundColor: "#fdf2f8",
  textAlign: "center" as const,
  marginTop: "12px",
};

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "#be185d",
  textTransform: "uppercase" as const,
};

const priorityValueStyle = {
  fontSize: "42px",
  color: "#9d174d",
  fontWeight: 600,
  margin: "8px 0",
};

const sectionHeadingStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
  marginBottom: "8px",
};

const listStyle = {
  margin: "0 0 0 18px",
  padding: 0,
  color: "#1f2937",
  fontSize: "15px",
};

const listItemStyle = {
  marginBottom: "4px",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "16px",
};

const primaryButtonStyle = {
  backgroundColor: "#be185d",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  backgroundColor: "#fdf2f8",
  color: "#9d174d",
  padding: "12px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const lightDividerStyle = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const metaTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
};

export default ClientReengagementEmail;
