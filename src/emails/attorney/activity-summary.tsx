import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { AttorneyEmailLayout } from "../components/AttorneyEmailLayout";

export type ActivityPriority = "high" | "medium" | "low";

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  timestamp: string;
  description?: string;
  claimantName?: string;
  priority?: ActivityPriority;
  link?: string;
}

export interface SummaryMetrics {
  newClients: number;
  packetsReady: number;
  documentsUploaded: number;
  claimantResponses: number;
  followUpsDue: number;
  queueDepth: number;
}

export interface AttorneyActivitySummaryEmailProps {
  previewText?: string;
  timeframeLabel?: string;
  summarySentAt?: string;
  nextSummaryWindow?: string;
  metrics?: SummaryMetrics;
  activities?: ActivityItem[];
  dashboardUrl?: string;
  managePreferencesUrl?: string;
  unsubscribeUrl?: string;
}

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "Mary Johnson uploaded pathology report",
    type: "DOCUMENT_UPLOADED",
    timestamp: "Today · 5:42 AM",
    description: "File automatically validated. Packet now 72% complete.",
    claimantName: "Mary Johnson",
    priority: "high",
    link: "https://app.radiantclaims.com/attorney/clients/RC-2025-00142",
  },
  {
    id: "act-2",
    title: "Packet ready for review: RC-2025-00112",
    type: "PACKET_READY",
    timestamp: "Today · 5:05 AM",
    description: "All supporting docs present. Waiting on attorney review.",
    claimantName: "Sam Carter",
    priority: "high",
    link: "https://app.radiantclaims.com/attorney/packets/RC-2025-00112",
  },
  {
    id: "act-3",
    title: "Claimant responded: needs help locating school record",
    type: "CLAIMANT_RESPONDED",
    timestamp: "Today · 4:48 AM",
    description: "Support shared resource list. Follow-up scheduled tomorrow.",
    claimantName: "Jess Lee",
    priority: "medium",
    link: "https://app.radiantclaims.com/attorney/activity",
  },
];

const defaultMetrics: SummaryMetrics = {
  newClients: 2,
  packetsReady: 1,
  documentsUploaded: 9,
  claimantResponses: 4,
  followUpsDue: 6,
  queueDepth: 12,
};

export const AttorneyActivitySummaryEmail = ({
  previewText = "Morning activity recap: packets ready, documents uploaded, and claimant follow-ups queued.",
  timeframeLabel = "Since 2:00 PM yesterday",
  summarySentAt = "6:00 AM Mountain",
  nextSummaryWindow = "Today at 2:00 PM Mountain",
  metrics = defaultMetrics,
  activities = defaultActivities,
  dashboardUrl = "https://app.radiantclaims.com/attorney/dashboard/activity",
  managePreferencesUrl = "https://app.radiantclaims.com/attorney/settings",
  unsubscribeUrl,
}: AttorneyActivitySummaryEmailProps) => {
  return (
    <AttorneyEmailLayout
      previewText={previewText}
      heading="Attorney Activity Summary"
      subheading={timeframeLabel}
      dashboardUrl={dashboardUrl}
      settingsUrl={managePreferencesUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          {summarySentAt}
        </Heading>
        <Text style={mutedTextStyle}>
          We batched everything meaningful from the last window. Below are the
          highlights that need your attention.
        </Text>
      </Section>

      <Section style={metricsGridStyle}>
        {renderMetric("New Clients", metrics.newClients, "#6366f1")}
        {renderMetric("Packets Ready", metrics.packetsReady, "#f97316")}
        {renderMetric("Docs Uploaded", metrics.documentsUploaded, "#0ea5e9")}
        {renderMetric(
          "Claimant Responses",
          metrics.claimantResponses,
          "#10b981"
        )}
        {renderMetric("Follow-ups Due", metrics.followUpsDue, "#ec4899")}
        {renderMetric("Queue Depth", metrics.queueDepth, "#64748b")}
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>Activity Feed ({activities.length})</Text>
        <Section style={activityListStyle}>
          {activities.map((activity) => (
            <Section key={activity.id} style={activityItemStyle}>
              <div style={activityTitleRowStyle}>
                <Text style={activityTypeStyle}>{activity.type}</Text>
                {activity.priority ? (
                  <span style={priorityBadgeStyles[activity.priority]}>
                    {activity.priority.toUpperCase()}
                  </span>
                ) : null}
              </div>
              <Heading as="h3" style={activityTitleStyle}>
                {activity.title}
              </Heading>
              {activity.description ? (
                <Text style={activityDescriptionStyle}>
                  {activity.description}
                </Text>
              ) : null}
              <Text style={timestampStyle}>{activity.timestamp}</Text>
              {activity.link ? (
                <a href={activity.link} style={linkStyle}>
                  View in dashboard →
                </a>
              ) : null}
            </Section>
          ))}
        </Section>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>Next Summary</Text>
        <Text style={mutedTextStyle}>{nextSummaryWindow}</Text>
        <Text style={mutedTextStyle}>
          Need to pause or change cadence? Update preferences with one click.
        </Text>
        <Button href={managePreferencesUrl} style={secondaryButtonStyle}>
          Adjust Preferences
        </Button>
      </Section>

      <Section style={buttonGroupStyle}>
        <Button href={dashboardUrl} style={primaryButtonStyle}>
          Review activity dashboard
        </Button>
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        We only email when there is something worth reading. If there is no
        activity, this summary is automatically suppressed.
      </Text>
    </AttorneyEmailLayout>
  );
};

const renderMetric = (label: string, value: number, accent: string) => (
  <Section key={label} style={{ ...metricCardStyle, borderTopColor: accent }}>
    <Text style={metricLabelStyle}>{label}</Text>
    <Text style={{ ...metricValueStyle, color: accent }}>{value}</Text>
  </Section>
);

const cardSectionStyle = {
  padding: "16px 0",
};

const cardHeadingStyle = {
  fontSize: "18px",
  color: "#0f172a",
  marginBottom: "6px",
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  margin: "12px 0 8px",
};

const metricCardStyle = {
  border: "1px solid #e2e8f0",
  borderTopWidth: "4px",
  borderRadius: "12px",
  padding: "12px",
  backgroundColor: "#f8fafc",
};

const metricLabelStyle = {
  fontSize: "13px",
  color: "#475569",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

const metricValueStyle = {
  fontSize: "28px",
  fontWeight: 600,
  marginTop: "4px",
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6366f1",
};

const activityListStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  marginTop: "12px",
};

const activityItemStyle = {
  padding: "16px",
  borderBottom: "1px solid #e2e8f0",
};

const activityTitleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const activityTypeStyle = {
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "#94a3b8",
};

const priorityBadgeStyles: Record<ActivityPriority, React.CSSProperties> = {
  high: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
  },
  medium: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
  },
  low: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
  },
};

const activityTitleStyle = {
  fontSize: "16px",
  margin: "4px 0",
  color: "#0f172a",
};

const activityDescriptionStyle = {
  fontSize: "14px",
  color: "#475569",
};

const timestampStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  marginTop: "6px",
};

const linkStyle = {
  color: "#4f46e5",
  fontSize: "14px",
  textDecoration: "none",
};

const buttonGroupStyle = {
  marginTop: "8px",
  display: "flex",
  justifyContent: "center",
};

const primaryButtonStyle = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  padding: "14px 26px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  backgroundColor: "#e0e7ff",
  color: "#312e81",
  padding: "12px 18px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 600,
  marginTop: "12px",
};

const lightDividerStyle = {
  borderColor: "#f1f5f9",
  margin: "20px 0",
};

const metaTextStyle = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
};

export default AttorneyActivitySummaryEmail;
