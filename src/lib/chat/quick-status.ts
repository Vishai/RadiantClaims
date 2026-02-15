import { labelForDocumentType } from "@/lib/chat/document-type-labels";

export type ChatSessionContext = {
  state?: string;
  county?: string;
  claimType?: string;
  intakeSessionId?: string;
  recaWorkflowStage?: number | null;
  recaWorkflowSection?: string | null;
  recaCompletionPercent?: number | null;
  missingDocuments?: Array<{ documentType: string; status: string }>;
  documentStatusCounts?: Record<string, number>;
};

export function buildChatQuickStatus(
  sessionContext?: ChatSessionContext,
  opts?: { includeMissingDocs?: boolean }
) {
  if (!sessionContext) return "";

  const includeMissingDocs = opts?.includeMissingDocs ?? true;

  const lines: string[] = [];
  const section = sessionContext.recaWorkflowSection || "";
  const completion =
    typeof sessionContext.recaCompletionPercent === "number"
      ? sessionContext.recaCompletionPercent
      : null;

  if (section) lines.push(`• Current step: ${section}`);
  if (completion !== null) lines.push(`• Progress: ~${completion}% complete`);

  const missing =
    includeMissingDocs && Array.isArray(sessionContext.missingDocuments)
      ? sessionContext.missingDocuments
      : [];

  if (missing.length > 0) {
    const sample = missing
      .slice(0, 4)
      .map((m: any) => `${labelForDocumentType(m.documentType)} (${m.status})`)
      .join(", ");
    lines.push(`• Documents still in progress: ${sample}`);
  }

  const sectionNudges: Record<string, string> = {
    part_1:
      "Confirm your name, DOB, and SSN match your ID exactly (avoid typos).",
    part_2:
      "Enter the deceased individual’s details exactly as on the death certificate.",
    part_3: "Confirm relationship type—this changes required documents.",
    part_4:
      "List exposure locations/dates; residence proof requirements depend on this.",
    part_5:
      "As spouse: be ready to provide marriage certificate and (if applicable) divorce decree(s).",
    part_6:
      "As child: be ready with birth certificate(s) linking you to the deceased.",
    part_7:
      "For extended family: gather documents proving the chain of relationship.",
    part_11:
      "Have cancer diagnosis documentation ready (pathology and/or treating facility records).",
    supporting_forms:
      "Complete releases/authorizations so records requests don’t get rejected.",
    document_checklist:
      "Use the checklist to request missing records first (vital + medical).",
    final_review: "Scan for name/date consistency before generating packets.",
  };

  const nudge = sectionNudges[section];
  if (nudge) lines.push(`• Next best action: ${nudge}`);

  if (lines.length === 0) return "";
  return `Quick status (from your claim progress):\n${lines.join("\n")}`;
}
