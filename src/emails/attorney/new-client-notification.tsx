import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { AttorneyEmailLayout } from "../components/AttorneyEmailLayout";

export interface ClaimantSummary {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  county?: string;
  claimId?: string;
}

export interface ClaimOverview {
  exposurePeriod?: string;
  diagnosis?: string;
  diagnosisDate?: string;
  completionPercent?: number;
  currentStatus?: string;
}

export interface AttorneyNewClientNotificationProps {
  previewText?: string;
  attorneyName?: string;
  firmName?: string;
  claimant?: ClaimantSummary;
  claim?: ClaimOverview;
  dashboardUrl?: string;
  claimantUrl?: string;
  settingsUrl?: string;
  nextSteps?: string[];
  unsubscribeUrl?: string;
}

export const AttorneyNewClientNotification = ({
  previewText = "New client assigned — review details and reach out within 24 hours.",
  attorneyName = "Jordan Blake",
  firmName = "Blake & Carter LLP",
  claimant = {
    name: "Mary Johnson",
    email: "mary.j@example.com",
    phone: "(435) 555-0123",
    city: "St. George",
    state: "UT",
    county: "Washington County",
    claimId: "RC-2025-00142",
  },
  claim = {
    exposurePeriod: "1955-1962",
    diagnosis: "Lung Cancer",
    diagnosisDate: "March 2024",
    completionPercent: 35,
    currentStatus: "Client uploading documents",
  },
  dashboardUrl = "https://app.radiantclaims.com/attorney/dashboard/activity",
  claimantUrl = "https://app.radiantclaims.com/attorney/clients/RC-2025-00142",
  settingsUrl = "https://app.radiantclaims.com/attorney/settings",
  nextSteps = [
    "Review claimant profile and confirm conflict check",
    "Assign internal point-of-contact if needed",
    "Flag missing documents for our follow-up cadence",
  ],
  unsubscribeUrl,
}: AttorneyNewClientNotificationProps) => {
  return (
    <AttorneyEmailLayout
      previewText={previewText}
      heading="New Client Assigned"
      subheading="You have a fresh RECA claim waiting"
      dashboardUrl={dashboardUrl}
      settingsUrl={settingsUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          Welcome {attorneyName}, meet your new client
        </Heading>
        <Text style={mutedTextStyle}>
          We routed a new client to <strong>{firmName}</strong>. The intake is
          verified, billing completed, and the claimant is actively working
          through document uploads.
        </Text>
      </Section>

      <Section style={infoGridStyle}>
        <Section style={infoCardStyle}>
          <Text style={eyebrowStyle}>Claimant</Text>
          <Text style={infoTitleStyle}>{claimant.name}</Text>
          <Text style={infoBodyStyle}>{claimant.email}</Text>
          {claimant.phone ? (
            <Text style={infoBodyStyle}>{claimant.phone}</Text>
          ) : null}
          <Text style={infoBodyStyle}>
            {claimant.city}, {claimant.state}
          </Text>
          <Text style={infoBodyStyle}>{claimant.county}</Text>
          {claimant.claimId ? (
            <Text style={infoBodyStyle}>Claim ID: {claimant.claimId}</Text>
          ) : null}
        </Section>

        <Section style={infoCardStyle}>
          <Text style={eyebrowStyle}>Claim Overview</Text>
          {claim.exposurePeriod ? (
            <Text style={infoBodyStyle}>
              Exposure Period: <strong>{claim.exposurePeriod}</strong>
            </Text>
          ) : null}
          {claim.diagnosis ? (
            <Text style={infoBodyStyle}>
              Primary Diagnosis: <strong>{claim.diagnosis}</strong>
            </Text>
          ) : null}
          {claim.diagnosisDate ? (
            <Text style={infoBodyStyle}>Diagnosed: {claim.diagnosisDate}</Text>
          ) : null}
          {typeof claim.completionPercent === "number" ? (
            <Text style={infoBodyStyle}>
              Portal Progress: {claim.completionPercent}% complete
            </Text>
          ) : null}
          {claim.currentStatus ? (
            <Text style={infoBodyStyle}>Status: {claim.currentStatus}</Text>
          ) : null}
        </Section>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>Immediate Next Steps</Text>
        <ul style={listStyle}>
          {nextSteps.map((item) => (
            <li key={item} style={listItemStyle}>
              {item}
            </li>
          ))}
        </ul>
        <Text style={mutedTextStyle}>
          We will keep batching progress updates into your 6:00 AM and 2:00 PM
          summary emails. Real-time activity also appears in the attorney
          dashboard.
        </Text>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button style={primaryButtonStyle} href={claimantUrl}>
          View Claim Details
        </Button>
        <Button style={secondaryButtonStyle} href={dashboardUrl}>
          Open Dashboard
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Section>
        <Text style={metaTextStyle}>
          Need to change who receives these? Update notification preferences or
          disable immediate alerts in{" "}
          <a href={settingsUrl} style={linkStyle}>
            firm settings
          </a>
          .
        </Text>
      </Section>
    </AttorneyEmailLayout>
  );
};

const cardSectionStyle = {
  padding: "16px 0",
};

const cardHeadingStyle = {
  fontSize: "20px",
  color: "#0f172a",
  margin: "0 0 8px 0",
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const infoGridStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
};

const infoCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  backgroundColor: "#f8fafc",
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6366f1",
};

const infoTitleStyle = {
  fontSize: "18px",
  fontWeight: 600,
  color: "#0f172a",
  margin: "4px 0",
};

const infoBodyStyle = {
  fontSize: "15px",
  color: "#1f2937",
  margin: "2px 0",
};

const listStyle = {
  margin: "8px 0 12px 18px",
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
  gap: "12px",
  marginTop: "8px",
};

const primaryButtonStyle = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  padding: "14px 16px",
  borderRadius: "12px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
};

const secondaryButtonStyle = {
  backgroundColor: "#e0e7ff",
  color: "#312e81",
  padding: "14px 16px",
  borderRadius: "12px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
};

const lightDividerStyle = {
  borderColor: "#f1f5f9",
  margin: "24px 0",
};

const metaTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
};

const linkStyle = {
  color: "#4f46e5",
  textDecoration: "none",
};

export default AttorneyNewClientNotification;
