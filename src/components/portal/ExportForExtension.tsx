"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Copy, Puzzle, ExternalLink } from "lucide-react";
import type { RECAFormData } from "@/lib/reca/types";

// Maps file categories to DOJ portal tab names
const CATEGORY_TO_DOJ_TAB: Record<string, string> = {
  IDENTITY: "Identification Documentation",
  BIRTH_CERTIFICATE: "Identification Documentation",
  MARRIAGE_CERTIFICATE: "Identification Documentation",
  UTILITY_BILL: "Proof of Presence",
  SCHOOL_RECORDS: "Proof of Presence",
  EMPLOYMENT_RECORDS: "Proof of Presence",
  TAX_RETURN: "Proof of Presence",
  LDS_CHURCH_RECORDS: "Proof of Presence",
  PROOF_OF_RESIDENCE: "Proof of Presence",
  CHURCH_RECORDS: "Proof of Presence",
  MORTGAGE_STATEMENT: "Proof of Presence",
  PROPERTY_RECORDS: "Proof of Presence",
  VOTING_RECORDS: "Proof of Presence",
  CENSUS_RECORDS: "Proof of Presence",
  PATHOLOGY_REPORT: "Compensable and Proof of Disease",
  MEDICAL_RECORDS: "Compensable and Proof of Disease",
  DISCHARGE_SUMMARY: "Compensable and Proof of Disease",
  TREATMENT_RECORDS: "Compensable and Proof of Disease",
  DEATH_CERTIFICATE: "Compensable and Proof of Disease",
};

interface UploadedFile {
  id: string;
  originalFilename: string;
  category?: string | null;
  sizeBytes: number;
}

interface ExportForExtensionProps {
  sessionId: string;
  claimId: string;
  formData: Partial<RECAFormData>;
  uploadedFiles: UploadedFile[];
}

export function ExportForExtension({
  sessionId,
  claimId: _claimId,
  formData,
  uploadedFiles,
}: ExportForExtensionProps) {
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildExportBlob = () => {
    const documents = uploadedFiles.map((f) => ({
      id: f.id,
      filename: f.originalFilename,
      category: f.category || "OTHER",
      dojTab: CATEGORY_TO_DOJ_TAB[f.category || ""] || "Other",
      sizeBytes: f.sizeBytes,
      downloadUrl: null,
    }));

    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        sessionId,
        answers: formData,
        documents,
      },
      null,
      2
    );
  };

  const handleCopy = async () => {
    const blob = buildExportBlob();
    try {
      await navigator.clipboard.writeText(blob);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = blob;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Puzzle className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-purple-900">
              Chrome Extension Helper
            </CardTitle>
            <CardDescription className="text-xs text-purple-700">
              Auto-fill your data into the DOJ portal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs text-purple-800">
            Install the{" "}
            <span className="font-semibold">
              RadiantClaims Chrome Extension
            </span>
            , then click{" "}
            <span className="font-semibold">Connect &amp; Load Data</span> in
            the extension popup. Your claim data will be loaded automatically.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
            <p className="text-[11px] text-purple-700">
              The extension will connect securely using your current login
              session — no copying needed.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManualCopy(!showManualCopy)}
          className="w-full cursor-pointer border-none bg-transparent text-center text-[11px] text-purple-500 underline hover:text-purple-700"
        >
          {showManualCopy ? "Hide manual copy" : "Copy data manually instead"}
        </button>

        {showManualCopy && (
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full gap-2 rounded-full border-purple-300 text-purple-700 hover:bg-purple-50"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Data for Extension
              </>
            )}
          </Button>
        )}

        <p className="text-center text-[10px] text-purple-600">
          Data stays on your device — never sent to any third-party server
        </p>
      </CardContent>
    </Card>
  );
}
