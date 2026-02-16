import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, FileArchive, ListChecks } from "lucide-react";

type UploadedFile = {
  id: string;
  originalFilename: string | null;
  category: string | null;
  status?: string | null;
};

interface DOJSubmissionCardProps {
  packetReady?: boolean;
  onDownloadPacket?: () => void;
  isDownloading?: boolean;
  uploadedFiles?: UploadedFile[];
}

const DOJ_PORTAL_URL = "https://reca.justice.gov/";

export function DOJSubmissionCard({
  packetReady = false,
  onDownloadPacket,
  isDownloading = false,
  uploadedFiles = [],
}: DOJSubmissionCardProps) {
  const docNames = uploadedFiles
    .filter((f) => (f.status ?? "").toUpperCase() !== "REJECTED")
    .map((f) => ({
      name: f.originalFilename ?? f.id,
      category: f.category ?? "Uncategorized",
    }))
    .slice(0, 12);

  const remaining = Math.max(
    0,
    uploadedFiles.filter((f) => (f.status ?? "").toUpperCase() !== "REJECTED")
      .length - docNames.length
  );

  return (
    <Card className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-700">
              DOJ E-file Handoff
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">New</Badge>
              <span className="text-sm font-semibold text-blue-900">
                Submit your claim online (recommended)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="gap-2 rounded-full"
              onClick={onDownloadPacket}
              disabled={!packetReady || !onDownloadPacket || isDownloading}
            >
              <FileArchive className="h-4 w-4" />
              {isDownloading ? "Preparing…" : "Download Upload Packet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full border-blue-300 text-blue-800 hover:bg-blue-50"
              onClick={() =>
                window.open(DOJ_PORTAL_URL, "_blank", "noopener,noreferrer")
              }
            >
              <ExternalLink className="h-4 w-4" />
              Open DOJ Portal
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white/70 p-3 text-sm text-blue-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ListChecks className="h-4 w-4" />
            What to do (2 minutes)
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-blue-900">
            <li>
              Download your RadiantClaims upload packet (ZIP) and unzip it.
            </li>
            <li>
              In the DOJ portal, upload the completed claim form PDF and your
              supporting documents.
            </li>
            <li>
              Keep originals/certified copies available — DOJ may request them
              later to validate authenticity.
            </li>
          </ol>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white/70 p-3">
          <p className="mb-2 text-sm font-semibold text-blue-900">
            Your upload set (from this claim)
          </p>
          {uploadedFiles.length === 0 ? (
            <p className="text-sm text-blue-800">
              No supporting documents uploaded yet.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-blue-900">
              {docNames.map((doc) => (
                <li key={`${doc.category}-${doc.name}`}>
                  • {doc.name}{" "}
                  <span className="text-xs text-blue-700">
                    ({doc.category})
                  </span>
                </li>
              ))}
              {remaining > 0 && (
                <li className="text-xs text-blue-700">…and {remaining} more</li>
              )}
            </ul>
          )}
          <p className="mt-2 text-xs text-blue-700">
            This is guidance only. Always follow the DOJ portal prompts.
          </p>
        </div>
      </div>
    </Card>
  );
}
