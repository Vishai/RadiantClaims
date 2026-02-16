"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_CHECKLIST,
  type DocumentRequirement,
} from "@/lib/document-checklist";
import type { FileCategory } from "@/lib/intake-upload";

const DOJ_PORTAL_URL = "https://reca.justice.gov/";

type UploadedFile = {
  id: string;
  originalFilename: string | null;
  category: FileCategory | null;
  status?: string | null;
};

interface DOJUploadChecklistProps {
  uploadedFiles: UploadedFile[];
  packetReady?: boolean;
}

type ItemStatus = "uploaded" | "partial" | "missing" | "optional";

function getItemStatus(req: DocumentRequirement, count: number): ItemStatus {
  if (req.minRequired === 0) {
    return count > 0 ? "uploaded" : "optional";
  }
  if (count >= req.minRequired) return "uploaded";
  if (count > 0) return "partial";
  return "missing";
}

const STATUS_ICON: Record<ItemStatus, JSX.Element> = {
  uploaded: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  partial: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  missing: <Circle className="h-4 w-4 text-rose-400" />,
  optional: <Circle className="h-4 w-4 text-sage-300" />,
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  uploaded: "Ready",
  partial: "Needs more",
  missing: "Required",
  optional: "Optional",
};

export function DOJUploadChecklist({
  uploadedFiles,
  packetReady: _packetReady = false,
}: DOJUploadChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const nonRejected = uploadedFiles.filter(
    (f) => (f.status ?? "").toUpperCase() !== "REJECTED"
  );

  const countByCategory = (cat: FileCategory): number =>
    nonRejected.filter((f) => f.category === cat).length;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calculate overall readiness
  let totalRequired = 0;
  let totalMet = 0;

  DOCUMENT_CHECKLIST.forEach((section) => {
    if (section.id === "residence") {
      // Residence is special: need ≥2 across all residence categories
      const residenceCategories: FileCategory[] = [
        "PROOF_OF_RESIDENCE",
        "UTILITY_BILL",
        "SCHOOL_RECORDS",
        "MORTGAGE_STATEMENT",
        "LDS_CHURCH_RECORDS",
      ];
      const total = residenceCategories.reduce(
        (sum, cat) => sum + countByCategory(cat),
        0
      );
      totalRequired += 2;
      totalMet += Math.min(total, 2);
    } else {
      section.requirements.forEach((req) => {
        if (req.isRequired) {
          totalRequired += req.minRequired;
          totalMet += Math.min(countByCategory(req.category), req.minRequired);
        }
      });
    }
  });

  const pct =
    totalRequired > 0 ? Math.round((totalMet / totalRequired) * 100) : 0;
  const allMet = totalMet >= totalRequired;

  return (
    <Card className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-700">
              DOJ Upload Checklist
            </p>
            <p className="mt-1 text-sm text-blue-900">
              Everything DOJ expects when you file online. Green = you have it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                allMet
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }
            >
              {pct}% ready
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-full border-blue-300 text-blue-800 hover:bg-blue-50"
              onClick={() =>
                window.open(DOJ_PORTAL_URL, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-3 w-3" />
              DOJ Portal
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-blue-800">
            {totalMet}/{totalRequired} required
          </span>
        </div>

        {/* E-file note */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-800">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            If you file online, you may upload <strong>scans</strong> of
            original/certified documents. DOJ may request the physical
            originals/certified copies later to validate authenticity.
          </span>
        </div>

        {/* Sections */}
        {DOCUMENT_CHECKLIST.map((section) => {
          const isExpanded = expandedSections.has(section.id);

          // Section-level summary
          const sectionItems = section.requirements.map((req) => ({
            req,
            count: countByCategory(req.category),
            status: getItemStatus(req, countByCategory(req.category)),
          }));

          const sectionHasMissing = sectionItems.some(
            (i) => i.status === "missing" || i.status === "partial"
          );
          const sectionAllGood = !sectionHasMissing;

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl border border-blue-100 bg-white"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-blue-50/40"
              >
                {sectionAllGood ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">
                    {section.title}
                  </p>
                  <p className="text-xs text-blue-700">{section.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-blue-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-blue-100 bg-blue-50/30 p-3">
                  <ul className="space-y-2">
                    {sectionItems.map(({ req, count, status }) => {
                      const files = nonRejected.filter(
                        (f) => f.category === req.category
                      );
                      return (
                        <li
                          key={req.category}
                          className="flex items-start gap-2"
                        >
                          {STATUS_ICON[status]}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-900">
                                {req.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] leading-tight"
                              >
                                {STATUS_LABEL[status]}
                              </Badge>
                              {count > 0 && (
                                <span className="text-xs text-blue-700">
                                  ({count} file{count !== 1 ? "s" : ""})
                                </span>
                              )}
                            </div>
                            {files.length > 0 && (
                              <ul className="mt-1 space-y-0.5 pl-1">
                                {files.slice(0, 4).map((f) => (
                                  <li
                                    key={f.id}
                                    className="flex items-center gap-1 text-xs text-blue-800"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {f.originalFilename ?? f.id}
                                  </li>
                                ))}
                                {files.length > 4 && (
                                  <li className="text-xs text-blue-600">
                                    …and {files.length - 4} more
                                  </li>
                                )}
                              </ul>
                            )}
                            {req.requiresOriginal && (
                              <p className="mt-0.5 text-[10px] text-amber-700">
                                Upload scan for e-file; DOJ may request
                                original/certified later
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
