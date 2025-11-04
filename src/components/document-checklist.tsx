"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  Mail,
  Download,
  Edit,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import {
  ChecklistSection,
  DocumentRequirement,
} from "@/lib/document-checklist";
import { FileCategory } from "@/lib/intake-upload";

interface DocumentChecklistProps {
  sections: ChecklistSection[];
  uploadedFiles: Array<{ category: FileCategory | null }>;
  onCategorySelect?: (category: FileCategory) => void;
}

export function DocumentChecklistComponent({
  sections,
  uploadedFiles,
  onCategorySelect,
}: DocumentChecklistProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["identity", "residence", "medical"])
  );
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleRequirement = (requirementId: string) => {
    setExpandedRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(requirementId)) {
        next.delete(requirementId);
      } else {
        next.add(requirementId);
      }
      return next;
    });
  };

  const getUploadedCount = (category: FileCategory): number => {
    return uploadedFiles.filter((f) => f.category === category).length;
  };

  const getRequirementStatus = (
    req: DocumentRequirement
  ): "complete" | "partial" | "missing" | "optional" => {
    const uploaded = getUploadedCount(req.category);

    // For optional items (minRequired = 0)
    if (req.minRequired === 0) {
      if (uploaded > 0) return "complete"; // Has uploads
      return "optional"; // No uploads, but that's okay
    }

    // For required items
    if (uploaded >= req.minRequired) return "complete";
    if (uploaded > 0) return "partial";
    return "missing";
  };

  const getSectionProgress = (section: ChecklistSection) => {
    // Special handling for residence section - based on total uploads
    if (section.id === "residence") {
      const uploadCount = getResidenceUploadCount();
      return Math.min(Math.round((uploadCount / 2) * 100), 100);
    }

    const requirements = section.requirements.filter((r) => r.isRequired);
    if (requirements.length === 0) return 100;

    const completed = requirements.filter(
      (req) => getUploadedCount(req.category) >= req.minRequired
    ).length;

    return Math.round((completed / requirements.length) * 100);
  };

  const getResidenceUploadCount = () => {
    // Count all uploads across all residence-related categories
    const residenceCategories: FileCategory[] = [
      "PROOF_OF_RESIDENCE",
      "UTILITY_BILL",
      "SCHOOL_RECORDS",
      "MORTGAGE_STATEMENT",
      "LDS_CHURCH_RECORDS",
    ];

    return uploadedFiles.filter(
      (f) => f.category && residenceCategories.includes(f.category)
    ).length;
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const progress = getSectionProgress(section);

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border-2 border-cream-200 bg-white shadow-sm"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-cream-50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-sage-900">
                    {section.title}
                  </h3>
                  {progress === 100 && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                </div>
                <p className="mt-1 text-sm text-sage-600">
                  {section.description}
                </p>

                {/* Special upload count for residence section */}
                {section.id === "residence" && (
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium ${
                        getResidenceUploadCount() >= 2
                          ? "text-emerald-700"
                          : getResidenceUploadCount() > 0
                            ? "text-amber-700"
                            : "text-terracotta-600"
                      }`}
                    >
                      {getResidenceUploadCount()} of 2 minimum uploaded
                    </span>
                    {getResidenceUploadCount() < 2 && (
                      <span className="ml-2 text-sm text-terracotta-600">
                        • {2 - getResidenceUploadCount()} more needed
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <div
                      className="h-full bg-terracotta-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-sage-700">
                    {progress}%
                  </span>
                </div>
              </div>

              {isExpanded ? (
                <ChevronUp className="ml-4 h-5 w-5 text-sage-500" />
              ) : (
                <ChevronDown className="ml-4 h-5 w-5 text-sage-500" />
              )}
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="border-t border-cream-200 bg-cream-50/50 p-5">
                <div className="space-y-4">
                  {section.requirements.map((req) => {
                    const requirementId = `${section.id}-${req.category}`;
                    const isReqExpanded =
                      expandedRequirements.has(requirementId);
                    const status = getRequirementStatus(req);
                    const uploaded = getUploadedCount(req.category);

                    return (
                      <div
                        key={requirementId}
                        className="overflow-hidden rounded-xl border border-cream-200 bg-white"
                      >
                        {/* Requirement Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <div className="mt-0.5">
                              {status === "complete" ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                              ) : status === "partial" ? (
                                <Circle className="h-6 w-6 text-amber-500" />
                              ) : status === "missing" ? (
                                <Circle className="h-6 w-6 text-terracotta-500" />
                              ) : (
                                // status === "optional" - empty optional item
                                <Circle className="h-6 w-6 text-sage-300" />
                              )}
                            </div>

                            {/* Requirement Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-sage-900">
                                      {req.title}
                                    </h4>
                                    {req.isRequired && (
                                      <span className="inline-flex items-center rounded-full bg-terracotta-100 px-2 py-0.5 text-xs font-medium text-terracotta-700">
                                        Required
                                      </span>
                                    )}
                                    {req.requiresOriginal && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                        <Mail className="h-3 w-3" />
                                        Original Required
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-sage-600">
                                    {req.description}
                                  </p>
                                  {req.originalNote && (
                                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                                      <Mail className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                      <span>{req.originalNote}</span>
                                    </div>
                                  )}

                                  {/* Uploaded count */}
                                  <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span
                                      className={`font-medium ${
                                        uploaded >= req.minRequired
                                          ? "text-emerald-700"
                                          : uploaded > 0
                                            ? "text-amber-700"
                                            : "text-sage-500"
                                      }`}
                                    >
                                      {uploaded} of {req.minRequired} minimum
                                      uploaded
                                    </span>
                                    {uploaded < req.minRequired &&
                                      req.isRequired && (
                                        <span className="text-terracotta-600">
                                          • {req.minRequired - uploaded} more
                                          needed
                                        </span>
                                      )}
                                  </div>

                                  {/* Timeframe note */}
                                  {req.timeframeNote && (
                                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                                      <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                      <span>{req.timeframeNote}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Upload button */}
                                <button
                                  onClick={() =>
                                    onCategorySelect?.(req.category)
                                  }
                                  className="flex-shrink-0 rounded-lg bg-terracotta-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-terracotta-600"
                                >
                                  Upload
                                </button>
                              </div>

                              {/* Expandable tips and examples */}
                              <button
                                onClick={() => toggleRequirement(requirementId)}
                                className="mt-3 flex items-center gap-2 text-xs font-medium text-sage-700 hover:text-sage-900"
                              >
                                <Info className="h-3.5 w-3.5" />
                                {isReqExpanded ? "Hide" : "Show"} tips &
                                examples
                                {isReqExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>

                              {/* Tips and Examples (expanded) */}
                              {isReqExpanded && (
                                <div className="mt-3 space-y-3 rounded-lg bg-sage-50 p-4">
                                  {/* Fill Out LDS Form (if applicable) */}
                                  {req.category === "LDS_CHURCH_RECORDS" && (
                                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                                      <h5 className="mb-2 text-sm font-semibold text-blue-900">
                                        Fill Out the LDS RECA Form
                                      </h5>
                                      <p className="mb-3 text-xs text-blue-800">
                                        Fill out this form online, then
                                        download, sign, and mail it to the LDS
                                        Church. They will send membership
                                        records directly to the DOJ to help
                                        prove your residence.
                                      </p>
                                      <div className="flex flex-wrap gap-3">
                                        <Link
                                          href={"/forms/lds-reca" as Route}
                                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                          <Edit className="h-4 w-4" />
                                          Fill Out Form Online
                                        </Link>
                                        <a
                                          href="/forms/lds-reca-form-2025.pdf"
                                          download
                                          className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                        >
                                          <Download className="h-4 w-4" />
                                          Download Blank PDF
                                        </a>
                                      </div>
                                      <p className="mt-3 text-xs text-blue-700">
                                        <strong>Mail completed form to:</strong>
                                        <br />
                                        RECA RESEARCH
                                        <br />
                                        Global Services Department
                                        <br />
                                        3740 West Market Center Drive
                                        <br />
                                        Riverton, UT 84065
                                        <br />
                                        Phone: 1-801-240-3500
                                      </p>
                                    </div>
                                  )}

                                  {/* Tips */}
                                  <div>
                                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
                                      Tips
                                    </h5>
                                    <ul className="space-y-1.5">
                                      {req.tips.map((tip, idx) => (
                                        <li
                                          key={idx}
                                          className="flex gap-2 text-xs text-sage-700"
                                        >
                                          <span className="text-terracotta-500">
                                            •
                                          </span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Examples */}
                                  <div>
                                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
                                      Examples
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {req.examples.map((example, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-sage-700 shadow-sm"
                                        >
                                          <FileText className="h-3 w-3 text-sage-400" />
                                          {example}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
