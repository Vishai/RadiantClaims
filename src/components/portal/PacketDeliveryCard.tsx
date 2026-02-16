import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  FileArchive,
  History,
} from "lucide-react";

type PacketStatus =
  | "NOT_READY"
  | "PROCESSING"
  | "READY_FOR_DOJ"
  | "OUTDATED"
  | "UNKNOWN";

interface PacketHistoryEntry {
  version: number;
  generatedAt: string;
  generatedBy?: string | null;
  status?: PacketStatus;
}

interface PacketDeliveryCardProps {
  status?: PacketStatus | null;
  warnings?: string[] | null;
  lastGeneratedAt?: string | null;
  readyAt?: string | null;
  onDownload?: () => void;
  onRegenerate?: () => void;
  downloadDisabled?: boolean;
  history?: PacketHistoryEntry[];
  isDownloading?: boolean;
  isRegenerating?: boolean;
}

const STATUS_COPY: Record<
  PacketStatus,
  { label: string; description: string; badgeClass: string; icon: JSX.Element }
> = {
  NOT_READY: {
    label: "Not Ready",
    description:
      "We still need to verify a few documents before this packet is DOJ-ready.",
    badgeClass: "bg-amber-100 text-amber-700",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  PROCESSING: {
    label: "Processing",
    description:
      "Our team is assembling your packet. You'll be notified once it's ready to download.",
    badgeClass: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-4 w-4" />,
  },
  READY_FOR_DOJ: {
    label: "Ready to Submit",
    description:
      "All checks passed! Download your upload packet and submit to DOJ online (recommended) or by mail.",
    badgeClass: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  OUTDATED: {
    label: "Needs Refresh",
    description:
      "New information was added since the last download. Regenerate the packet to include the latest documents.",
    badgeClass: "bg-rose-100 text-rose-700",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  UNKNOWN: {
    label: "Status Unknown",
    description:
      "We haven't generated a packet for this claim yet. Once enough documents are verified, you'll see status updates here.",
    badgeClass: "bg-gray-100 text-gray-700",
    icon: <FileArchive className="h-4 w-4" />,
  },
};

export function PacketDeliveryCard({
  status = "UNKNOWN",
  warnings = [],
  lastGeneratedAt,
  readyAt,
  onDownload,
  onRegenerate,
  downloadDisabled = true,
  history = [],
  isDownloading = false,
  isRegenerating = false,
}: PacketDeliveryCardProps) {
  const normalizedStatus: PacketStatus =
    status && STATUS_COPY[status as PacketStatus]
      ? (status as PacketStatus)
      : "UNKNOWN";
  const statusInfo = STATUS_COPY[normalizedStatus];
  const warningList = warnings ?? [];

  return (
    <Card className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-sage-500">
              Packet Delivery
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={`gap-1 ${statusInfo.badgeClass}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </Badge>
              {lastGeneratedAt && (
                <span className="text-xs text-sage-500">
                  Generated{" "}
                  {new Date(lastGeneratedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="gap-2 rounded-full"
              onClick={onDownload}
              disabled={downloadDisabled || isDownloading}
            >
              <ArrowDownToLine className="h-4 w-4" />
              {isDownloading ? "Preparing..." : "Download Packet"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 rounded-full text-sage-700 hover:bg-sage-50"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <History className="h-4 w-4" />
              {isRegenerating ? "Generating..." : "Regenerate"}
            </Button>
          </div>
        </div>

        <p className="text-sm text-sage-700">{statusInfo.description}</p>

        {readyAt && normalizedStatus !== "READY_FOR_DOJ" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">Packet pending final review</p>
            <p>
              Our team started reviewing this packet on{" "}
              {new Date(readyAt).toLocaleDateString()}.
            </p>
          </div>
        )}

        {warningList.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Action needed before submitting
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {warningList.map((warning, idx) => (
                <li key={`${warning}-${idx}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-cream-200 bg-cream-50 p-3">
          <p className="mb-2 text-sm font-semibold text-sage-800">
            Download History
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-sage-500">
              No downloads yet. Once the packet is generated, you’ll see the
              version history here.
            </p>
          ) : (
            <div className="space-y-2 text-sm text-sage-700">
              {history.slice(0, 3).map((entry) => (
                <div
                  key={`packet-history-${entry.version}-${entry.generatedAt}`}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      Version {entry.version} ·{" "}
                      {new Date(entry.generatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-sage-500">
                      {entry.generatedBy
                        ? `Generated by ${entry.generatedBy}`
                        : "Generated automatically"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs text-sage-600">
                    {entry.status
                      ? (STATUS_COPY[entry.status]?.label ?? entry.status)
                      : "Ready"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
