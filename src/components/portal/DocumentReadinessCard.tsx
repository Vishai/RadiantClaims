"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Upload,
  HelpCircle,
} from "lucide-react";
import { generatePortalRequirements } from "@/lib/reca/document-tracking";
import { AlertTriangle } from "lucide-react";

// Categories where DOJ may request certified originals after e-filing
const ORIGINAL_REQUIRED_CATEGORIES = new Set([
  "BIRTH_CERTIFICATE",
  "DEATH_CERTIFICATE",
  "MARRIAGE_CERTIFICATE",
  "PATHOLOGY_REPORT",
  "IDENTITY",
]);

interface UploadedFile {
  id: string;
  category: string | null;
  status: string;
  originalFilename: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface DocumentReadinessCardProps {
  formData: Record<string, any>;
  uploadedFiles: UploadedFile[];
  sessionId: string;
  claimType?: string;
}

export function DocumentReadinessCard({
  formData,
  uploadedFiles,
  sessionId,
  claimType,
}: DocumentReadinessCardProps) {
  const [expanded, setExpanded] = useState(true);

  const requirements = generatePortalRequirements(
    claimType || "DOWNWINDER",
    formData,
    uploadedFiles
  );

  const requiredDocs = requirements.filter((r) => r.required);
  const uploadedRequired = requiredDocs.filter((r) => r.uploaded);
  const missingRequired = requiredDocs.filter((r) => !r.uploaded);

  const totalRequired = requiredDocs.length;
  const totalUploaded = uploadedRequired.length;
  const pct =
    totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;
  const allReady = missingRequired.length === 0 && totalRequired > 0;

  return (
    <Card
      className={`rounded-2xl border-2 shadow-sm ${
        allReady
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                allReady ? "bg-emerald-100" : "bg-amber-100"
              }`}
            >
              <ShieldCheck
                className={`h-5 w-5 ${
                  allReady ? "text-emerald-600" : "text-amber-600"
                }`}
              />
            </div>
            <div>
              <CardTitle
                className={`text-base font-semibold ${
                  allReady ? "text-emerald-900" : "text-amber-900"
                }`}
              >
                Your Document Checklist
              </CardTitle>
              <p
                className={`text-xs ${
                  allReady ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {allReady
                  ? "All required documents are uploaded — you're ready to file!"
                  : "Personalized based on your application details"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                allReady
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }
            >
              {totalUploaded}/{totalRequired} ready
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div
            className={`h-2 flex-1 overflow-hidden rounded-full ${
              allReady ? "bg-emerald-100" : "bg-amber-100"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allReady ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={`text-xs font-medium ${
              allReady ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {pct}%
          </span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-2">
          {/* Missing documents — show first */}
          {missingRequired.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Still needed ({missingRequired.length})
              </p>
              <div className="space-y-1.5">
                {missingRequired.map((req, i) => (
                  <div
                    key={`missing-${req.category}-${i}`}
                    className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-white px-3 py-2"
                  >
                    <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-sage-900">
                        {req.label}
                      </p>
                      <p className="text-xs text-sage-600">{req.description}</p>
                      {ORIGINAL_REQUIRED_CATEGORIES.has(req.category) && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-sage-500">
                          <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          Upload a scan for e-filing; DOJ may request certified
                          original later
                        </p>
                      )}
                      {req.helpText && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-amber-700">
                          <HelpCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          {req.helpText}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded documents */}
          {uploadedRequired.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Ready ({uploadedRequired.length})
              </p>
              <div className="space-y-1">
                {uploadedRequired.map((req, i) => (
                  <div
                    key={`ready-${req.category}-${i}`}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-sage-700">{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload CTA */}
          {missingRequired.length > 0 && (
            <a
              href={`/reca/documents/${sessionId}`}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </a>
          )}

          {/* Why this list is personalized */}
          <div className="flex items-start gap-2 rounded-xl border border-sage-200 bg-sage-50/50 px-3 py-2.5 text-xs text-sage-600">
            <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sage-400" />
            <span>
              This checklist is generated from your specific application —
              including your relationship to the claimant, name changes, and
              family details. It updates automatically as you add information.
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
