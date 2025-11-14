import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { ClientEmailLayout } from "../components/ClientEmailLayout";

export interface MilestoneData {
  percentComplete: number;
  milestoneTitle: string;
  message: string;
  completedSteps: string[];
  upcomingSteps: string[];
  portalUrl?: string;
}

export interface ProgressMilestoneEmailProps {
  previewText?: string;
  claimantName?: string;
  milestone?: MilestoneData;
  supportEmail?: string;
  unsubscribeUrl?: string;
}

const defaultMilestone: MilestoneData = {
  percentComplete: 75,
  milestoneTitle: "Document Collection Mastered",
  message:
    "You finished every required section and only signature items remain.",
  completedSteps: [
    "Identity verification",
    "Residency proof",
    "Medical evidence",
  ],
  upcomingSteps: ["Attorney review", "Packet download + mail checklist"],
  portalUrl: "https://app.radiantclaims.com/portal/progress",
};

export const ClientProgressMilestoneEmail = ({
  previewText = "You hit a major milestone — here is what happens next.",
  claimantName = "Mary",
  milestone = defaultMilestone,
  supportEmail = "support@radiantclaims.com",
  unsubscribeUrl,
}: ProgressMilestoneEmailProps) => {
  return (
    <ClientEmailLayout
      previewText={previewText}
      portalUrl={milestone.portalUrl}
      headline="Progress Milestone"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={heroCardStyle}>
        <Text style={eyebrowStyle}>Milestone unlocked</Text>
        <Heading as="h2" style={heroHeadingStyle}>
          {milestone.milestoneTitle}
        </Heading>
        <Text style={mutedTextStyle}>
          {claimantName}, you&apos;re officially {milestone.percentComplete}% of
          the way to a DOJ-ready packet.
        </Text>
        <Text style={mutedTextStyle}>{milestone.message}</Text>
        <Text style={percentStyle}>{milestone.percentComplete}%</Text>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Completed</Text>
        <ul style={listStyle}>
          {milestone.completedSteps.map((step) => (
            <li key={step} style={listItemStyle}>
              ✓ {step}
            </li>
          ))}
        </ul>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={sectionHeadingStyle}>Up next</Text>
        <ul style={listStyle}>
          {milestone.upcomingSteps.map((step) => (
            <li key={step} style={listItemStyle}>
              → {step}
            </li>
          ))}
        </ul>
        <Text style={mutedTextStyle}>
          We will alert you the moment an attorney completes their review or if
          anything else is needed.
        </Text>
      </Section>

      <Section style={buttonGroupStyle}>
        {milestone.portalUrl ? (
          <Button href={milestone.portalUrl} style={primaryButtonStyle}>
            View progress tracker
          </Button>
        ) : null}
        <Button href={`mailto:${supportEmail}`} style={secondaryButtonStyle}>
          Ask a question
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        Celebrating progress keeps the process on track. Thanks for staying
        engaged — it shortens average completion time by 30%.
      </Text>
    </ClientEmailLayout>
  );
};

const heroCardStyle = {
  border: "1px solid #fde68a",
  borderRadius: "16px",
  padding: "20px",
  backgroundColor: "#fffbeb",
  textAlign: "center" as const,
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#d97706",
};

const heroHeadingStyle = {
  fontSize: "22px",
  color: "#92400e",
  margin: "8px 0",
};

const percentStyle = {
  fontSize: "40px",
  color: "#b45309",
  fontWeight: 600,
  marginTop: "12px",
};

const mutedTextStyle = {
  color: "#78350f",
  fontSize: "15px",
  lineHeight: "22px",
};

const cardSectionStyle = {
  marginTop: "18px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
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
  marginBottom: "6px",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "16px",
};

const primaryButtonStyle = {
  backgroundColor: "#d97706",
  color: "#ffffff",
  padding: "14px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
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

export default ClientProgressMilestoneEmail;
