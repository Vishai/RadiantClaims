import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";
import { AttorneyEmailLayout } from "../components/AttorneyEmailLayout";

export interface PacketMetadata {
  claimantName: string;
  claimId: string;
  completionPercent: number;
  documentsCount: number;
  preparedAt: string;
  packetUrl?: string;
  dashboardUrl?: string;
  notes?: string[];
}

export interface AttorneyPacketReadyEmailProps {
  previewText?: string;
  packet?: PacketMetadata;
  reviewChecklist?: string[];
  unsubscribeUrl?: string;
}

const defaultPacket: PacketMetadata = {
  claimantName: "Mary Johnson",
  claimId: "RC-2025-00112",
  completionPercent: 100,
  documentsCount: 18,
  preparedAt: "Nov 12, 2025 · 5:02 AM",
  packetUrl: "https://app.radiantclaims.com/attorney/packets/RC-2025-00112.pdf",
  dashboardUrl: "https://app.radiantclaims.com/attorney/packets/RC-2025-00112",
  notes: [
    "Includes notarized exposure statements",
    "Medical chronology verified by staff",
    "Supporting residency documents double-checked",
  ],
};

const defaultChecklist = [
  "Confirm conflict check + engagement letter complete",
  "Download packet and review cover letter language",
  "Request additional evidence if required before DOJ filing",
];

export const AttorneyPacketReadyEmail = ({
  previewText = "Another packet is ready for attorney review and DOJ submission.",
  packet = defaultPacket,
  reviewChecklist = defaultChecklist,
  unsubscribeUrl,
}: AttorneyPacketReadyEmailProps) => {
  return (
    <AttorneyEmailLayout
      previewText={previewText}
      heading="Packet Ready for Review"
      subheading="Final DOJ-ready packet prepared"
      dashboardUrl={packet.dashboardUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={cardSectionStyle}>
        <Heading as="h2" style={cardHeadingStyle}>
          {packet.claimantName} — {packet.claimId}
        </Heading>
        <Text style={mutedTextStyle}>
          We batched all supporting documentation and generated a DOJ-ready
          packet. Everything is waiting for your sign-off inside the attorney
          portal.
        </Text>

        <Section style={packetStatsStyle}>
          <Section style={statCardStyle}>
            <Text style={statValueStyle}>{packet.documentsCount}</Text>
            <Text style={statLabelStyle}>Documents</Text>
          </Section>
          <Section style={statCardStyle}>
            <Text style={statValueStyle}>{packet.completionPercent}%</Text>
            <Text style={statLabelStyle}>Portal Completion</Text>
          </Section>
          <Section style={statCardStyle}>
            <Text style={statValueStyle}>Ready</Text>
            <Text style={statLabelStyle}>Prepared {packet.preparedAt}</Text>
          </Section>
        </Section>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>What&apos;s Inside</Text>
        <ul style={listStyle}>
          {(packet.notes ?? []).map((note) => (
            <li key={note} style={listItemStyle}>
              {note}
            </li>
          ))}
        </ul>
      </Section>

      <Section style={cardSectionStyle}>
        <Text style={eyebrowStyle}>Attorney Checklist</Text>
        <ol style={orderedListStyle}>
          {reviewChecklist.map((item) => (
            <li key={item} style={orderedListItemStyle}>
              {item}
            </li>
          ))}
        </ol>
      </Section>

      <Section style={buttonGroupStyle}>
        {packet.packetUrl ? (
          <Button href={packet.packetUrl} style={primaryButtonStyle}>
            Download Packet PDF
          </Button>
        ) : null}
        {packet.dashboardUrl ? (
          <Button href={packet.dashboardUrl} style={secondaryButtonStyle}>
            View in Portal
          </Button>
        ) : null}
      </Section>

      <Hr style={lightDividerStyle} />
      <Text style={metaTextStyle}>
        This notification only fires when a packet reaches 100% readiness and
        passes automated validation.
      </Text>
    </AttorneyEmailLayout>
  );
};

const cardSectionStyle = {
  padding: "16px 0",
};

const cardHeadingStyle = {
  fontSize: "20px",
  marginBottom: "6px",
  color: "#0f172a",
};

const mutedTextStyle = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "22px",
};

const packetStatsStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  marginTop: "12px",
};

const statCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "12px",
  backgroundColor: "#f8fafc",
};

const statValueStyle = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#1e1b4b",
};

const statLabelStyle = {
  fontSize: "13px",
  color: "#475569",
};

const eyebrowStyle = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#6366f1",
};

const listStyle = {
  margin: "8px 0 12px 18px",
  color: "#1f2937",
  fontSize: "15px",
};

const listItemStyle = {
  marginBottom: "6px",
};

const orderedListStyle = {
  margin: "8px 0 12px 20px",
  color: "#1f2937",
  fontSize: "15px",
};

const orderedListItemStyle = {
  marginBottom: "8px",
};

const buttonGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  marginTop: "12px",
};

const primaryButtonStyle = {
  backgroundColor: "#4f46e5",
  color: "#ffffff",
  padding: "14px 20px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  backgroundColor: "#e0e7ff",
  color: "#312e81",
  padding: "12px 18px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
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

export default AttorneyPacketReadyEmail;
