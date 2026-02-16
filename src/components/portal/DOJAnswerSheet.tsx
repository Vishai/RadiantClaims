"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  User,
  MapPin,
  FileText,
  Stethoscope,
  DollarSign,
} from "lucide-react";
import type { RECAFormData } from "@/lib/reca/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldRow {
  label: string; // DOJ portal label
  value: string | undefined;
  portalSection?: string; // e.g. "Tab 1 → Mailing Address"
}

interface AnswerSheetSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  portalTab: string; // DOJ tab name
  fields: FieldRow[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  try {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function formatSSN(ssn?: string): string | undefined {
  if (!ssn) return undefined;
  const digits = ssn.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return ssn;
}

function exposureOptionLabel(opt: string): string {
  switch (opt) {
    case "option_1a":
      return "Physically present in designated area for entire period June 30–July 31, 1962";
    case "option_1b":
      return "Physically present in New Mexico for ≥1 year, Sep 24 1944–Nov 6 1962";
    case "option_2":
      return "Physically present in designated area for ≥1 year, Jan 21 1951–Nov 6 1962";
    default:
      return opt;
  }
}

function diseaseLabel(d: string): string {
  const map: Record<string, string> = {
    leukemia: "Leukemia",
    multiple_myeloma: "Multiple Myeloma",
    lymphomas: "Lymphomas (other than Hodgkin's disease)",
    cancer_thyroid: "Primary cancer of the thyroid",
    cancer_breast: "Primary cancer of the male or female breast",
    cancer_esophagus: "Primary cancer of the esophagus",
    cancer_stomach: "Primary cancer of the stomach",
    cancer_pharynx: "Primary cancer of the pharynx",
    cancer_small_intestine: "Primary cancer of the small intestine",
    cancer_pancreas: "Primary cancer of the pancreas",
    cancer_bile_ducts: "Primary cancer of the bile ducts",
    cancer_gall_bladder: "Primary cancer of the gall bladder",
    cancer_salivary_gland: "Primary cancer of the salivary gland",
    cancer_urinary_bladder: "Primary cancer of the urinary bladder",
    cancer_brain: "Primary cancer of the brain",
    cancer_colon: "Primary cancer of the colon",
    cancer_ovary: "Primary cancer of the ovary",
    cancer_liver:
      "Primary cancer of the liver (except if cirrhosis or hepatitis B is indicated)",
    cancer_lung: "Primary cancer of the lung",
  };
  return map[d] ?? d;
}

// ---------------------------------------------------------------------------
// Build sections from form data
// ---------------------------------------------------------------------------

function buildSections(fd: Partial<RECAFormData>): AnswerSheetSection[] {
  const p1 = fd.part_1;
  const p2 = fd.part_2;
  const p8 = fd.part_8;
  const p10 = fd.part_10;
  const p12 = fd.part_12;
  const p13 = fd.part_13;

  // Use claimant (part_2) if filing for someone else, otherwise filer (part_1)
  const person = p2 ?? p1;

  const sections: AnswerSheetSection[] = [];

  // ── Tab 1: Person Who Became Ill ──
  if (person) {
    sections.push({
      id: "identity",
      title: "Person Who Became Ill",
      icon: <User className="h-5 w-5" />,
      portalTab: "Claimant and Applicant",
      fields: [
        { label: "First Name", value: person.firstName },
        { label: "Middle Name", value: person.middleName },
        { label: "Last Name", value: person.lastName },
        {
          label: "Former and Maiden Names",
          value: person.formerNames
            ?.map((n) => `${n.name} (${n.type})`)
            .join("; "),
        },
        { label: "Social Security Number", value: formatSSN(person.ssn) },
        { label: "Date of Birth", value: formatDate(person.dob) },
      ],
    });
  }

  // ── Tab 1 (cont): Contact Info ──
  if (p1) {
    sections.push({
      id: "contact",
      title: "Contact & Address",
      icon: <MapPin className="h-5 w-5" />,
      portalTab: "Claimant and Applicant",
      fields: [
        { label: "Phone Number (Day)", value: p1.phoneDay },
        { label: "Phone Number (Evening)", value: p1.phoneEvening },
        { label: "Email", value: p1.email },
        {
          label: "Mailing Street",
          value: p1.mailingAddress,
          portalSection: "Mailing Address → Street",
        },
        {
          label: "City",
          value: p1.city,
          portalSection: "Mailing Address → City",
        },
        {
          label: "State",
          value: p1.state,
          portalSection: "Mailing Address → State/Province",
        },
        {
          label: "ZIP Code",
          value: p1.zipCode,
          portalSection: "Mailing Address → Zip/Postal Code",
        },
        {
          label: "Residence Address",
          value: p1.residenceAddress || "(same as mailing)",
          portalSection: "Residence Address",
        },
        {
          label: "Indian Tribe Member",
          value: p1.tribalAffiliation ? "Yes" : "No",
        },
        ...(p1.tribalAffiliation
          ? [
              {
                label: "Tribal Affiliation",
                value: p1.tribalAffiliation,
              },
            ]
          : []),
      ],
    });
  }

  // ── Tab 3: Exposure ──
  if (p8) {
    const locationFields: FieldRow[] = [];

    p8.affectedAreas?.forEach((area, i) => {
      const prefix = p8.affectedAreas!.length > 1 ? `Location ${i + 1}: ` : "";
      locationFields.push(
        { label: `${prefix}State`, value: area.state },
        { label: `${prefix}Town or City`, value: area.townCity },
        { label: `${prefix}Time Period`, value: area.timePeriod }
      );
    });

    p8.arizonaCounties?.forEach((area, i) => {
      locationFields.push(
        { label: `AZ Location ${i + 1}: County`, value: area.county },
        { label: `AZ Location ${i + 1}: Town or City`, value: area.townCity },
        { label: `AZ Location ${i + 1}: Time Period`, value: area.timePeriod }
      );
    });

    p8.nevadaCounties?.forEach((area, i) => {
      locationFields.push(
        { label: `NV Location ${i + 1}: County`, value: area.county },
        { label: `NV Location ${i + 1}: Town or City`, value: area.townCity },
        { label: `NV Location ${i + 1}: Time Period`, value: area.timePeriod }
      );
    });

    sections.push({
      id: "exposure",
      title: "Exposure Information",
      icon: <MapPin className="h-5 w-5" />,
      portalTab: "Exposure",
      fields: [
        {
          label: "Exposure Period",
          value: p8.exposureOptions?.map(exposureOptionLabel).join("; "),
        },
        ...locationFields,
      ],
    });
  }

  // ── Tab 5: Diseases ──
  if (p10) {
    sections.push({
      id: "disease",
      title: "Compensable Disease",
      icon: <Stethoscope className="h-5 w-5" />,
      portalTab: "Compensable and Proof of Disease",
      fields: p10.diseases.map((d) => ({
        label: "Disease",
        value: diseaseLabel(d),
      })),
    });
  }

  // ── Tab 6: Prior Compensation ──
  if (p12) {
    sections.push({
      id: "prior",
      title: "Prior Compensation",
      icon: <DollarSign className="h-5 w-5" />,
      portalTab: "Prior Compensation",
      fields: [
        {
          label: "Received prior payment/settlement?",
          value: p12.receivedPayment,
        },
        {
          label: "Payment details",
          value: p12.paymentDetails,
        },
        {
          label: "Received EEOICPA compensation?",
          value: p12.eeoicpaClaim,
        },
      ],
    });
  }

  // ── Attorney info ──
  if (p13) {
    sections.push({
      id: "attorney",
      title: "Attorney Representation",
      icon: <FileText className="h-5 w-5" />,
      portalTab: "Claimant and Applicant",
      fields: [
        { label: "Has Attorney", value: p13.hasAttorney },
        ...(p13.hasAttorney === "YES"
          ? [
              {
                label: "Attorney Name",
                value:
                  `${p13.attorneyFirstName ?? ""} ${p13.attorneyLastName ?? ""}`.trim(),
              },
            ]
          : []),
      ],
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

function AnswerSection({
  section,
  defaultOpen,
}: {
  section: AnswerSheetSection;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const filledCount = section.fields.filter((f) => f.value).length;
  const totalCount = section.fields.length;

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{section.icon}</span>
          <div>
            <p className="text-sm font-medium">{section.title}</p>
            <p className="text-xs text-muted-foreground">
              DOJ Portal → {section.portalTab}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filledCount}/{totalCount} fields
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {open && (
        <div className="divide-y">
          {section.fields.map((field, i) => (
            <div
              key={`${section.id}-${i}`}
              className="flex items-start justify-between px-4 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground">{field.label}</span>
                {field.portalSection && (
                  <span className="ml-1 text-xs text-muted-foreground/60">
                    ({field.portalSection})
                  </span>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-1">
                {field.value ? (
                  <>
                    <span className="max-w-[200px] truncate text-right font-medium">
                      {field.value}
                    </span>
                    <CopyButton text={field.value} />
                  </>
                ) : (
                  <span className="italic text-muted-foreground/50">
                    Not provided
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DOJAnswerSheetProps {
  formData: Partial<RECAFormData>;
}

export function DOJAnswerSheet({ formData }: DOJAnswerSheetProps) {
  const sections = buildSections(formData);
  const [allOpen, setAllOpen] = useState(true);

  if (sections.length === 0) {
    return null;
  }

  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);
  const filledFields = sections.reduce(
    (sum, s) => sum + s.fields.filter((f) => f.value).length,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">DOJ Portal Answer Sheet</CardTitle>
              <CardDescription>
                Your answers organized by DOJ portal section — copy each value
                into the portal fields
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAllOpen(!allOpen)}
          >
            {allOpen ? "Collapse All" : "Expand All"}
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${totalFields > 0 ? (filledFields / totalFields) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {filledFields} of {totalFields} fields ready
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {sections.map((section) => (
          <AnswerSection
            key={section.id}
            section={section}
            defaultOpen={allOpen}
          />
        ))}

        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Open the DOJ portal and enter these values tab by tab
          </p>
          <Button asChild size="sm">
            <a
              href="https://reca.justice.gov/ClaimsPortal/s/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open DOJ Portal
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
