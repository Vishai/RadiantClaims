"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AIIntelligenceModal } from "./AIIntelligenceModal";
import type { DocumentQualificationSummary } from "./types";
import { QUALIFICATION_COPY } from "./qualification-utils";

interface AIIntelligence {
  ocrConfidence?: number;
  textLength?: number;
  aiCategory?: string;
  aiCategoryConfidence?: number;
  aiReasoning?: string;
  tags?: Array<{ tag: string; confidence: number }>;
  qualityScore?: number;
  recommendations?: string[];
  pageCount?: number;
}

interface DocumentListItemProps {
  id: string;
  originalFilename: string;
  category?: string;
  categoryLocked?: boolean;
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  aiIntelligence?: AIIntelligence;
  validation?: {
    status:
      | "PENDING"
      | "PROCESSING"
      | "VERIFIED"
      | "NEEDS_REVIEW"
      | "STAFF_APPROVED"
      | "REJECTED"
      | "ERROR";
    category?: string;
    confidence?: number;
  } | null;
  qualification?: DocumentQualificationSummary | null;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRecategorize?: () => void;
  onViewIntelligence?: () => void;
}

export function DocumentListItem({
  id,
  originalFilename,
  category,
  categoryLocked,
  status,
  sizeBytes,
  uploadedAt,
  mimeType,
  aiIntelligence,
  qualification,
  onView,
  onDownload,
  onDelete,
  onRecategorize,
  onViewIntelligence,
}: DocumentListItemProps) {
  const router = useRouter();
  const [intelligenceModalOpen, setIntelligenceModalOpen] = useState(false);

  const handleRowClick = () => {
    router.push(`/portal/documents/${id}`);
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return ImageIcon;
    if (mime === "application/pdf") return FileText;
    return File;
  };

  const Icon = getFileIcon(mimeType);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (cat?: string) => {
    if (!cat) return "Uncategorized";
    return cat
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusConfig = (s: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      UPLOADING: { color: "text-blue-600", icon: Clock },
      PROCESSING: { color: "text-blue-600", icon: Clock },
      READY: { color: "text-emerald-600", icon: CheckCircle },
      FAILED: { color: "text-red-600", icon: XCircle },
      APPROVED: { color: "text-emerald-600", icon: CheckCircle },
      REJECTED: { color: "text-red-600", icon: XCircle },
      NEEDS_ATTENTION: { color: "text-orange-600", icon: AlertCircle },
    };
    return configs[s] || { color: "text-gray-600", icon: Clock };
  };

  const statusCfg = getStatusConfig(status);
  const StatusIcon = statusCfg.icon;
  const qualificationCopy = qualification
    ? QUALIFICATION_COPY[qualification.status]
    : null;
  const needsRecategorize = qualification?.userActionNeeded === "RECATEGORIZE";

  return (
    <div
      className="flex cursor-pointer items-center gap-4 rounded-lg border border-sage-200 bg-white p-3 transition-shadow hover:shadow-md"
      onClick={handleRowClick}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sage-100">
        <Icon className="h-5 w-5 text-sage-600" />
      </div>

      {/* File Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-sage-900">
            {originalFilename}
          </h3>
          <StatusIcon
            className={cn("h-4 w-4 flex-shrink-0", statusCfg.color)}
          />
          {qualificationCopy && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                qualificationCopy.className
              )}
            >
              {qualificationCopy.label}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-sage-600">
          <span>{getCategoryLabel(category)}</span>
          {categoryLocked && (
            <span className="flex items-center gap-1 text-amber-700">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
          <span>&middot;</span>
          <span>{formatFileSize(sizeBytes)}</span>
          <span>&middot;</span>
          <span>{formatDate(uploadedAt)}</span>
        </div>
      </div>

      {/* AI Badge */}
      {aiIntelligence && status === "READY" && (
        <Badge
          variant="outline"
          className="flex-shrink-0 border-purple-300 bg-purple-50 text-purple-700"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          AI
          {aiIntelligence.ocrConfidence !== undefined &&
            ` ${(aiIntelligence.ocrConfidence * 100).toFixed(0)}%`}
        </Badge>
      )}

      {/* Actions - stop propagation so clicks don't navigate */}
      <div
        className="flex flex-shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {aiIntelligence && status === "READY" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewIntelligence) {
                onViewIntelligence();
              } else {
                setIntelligenceModalOpen(true);
              }
            }}
            className="h-8 px-2 text-purple-600 hover:bg-purple-50"
            title="View AI Intelligence"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        {onView && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="h-8 px-2"
            title="View PDF"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onDownload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="h-8 px-2"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {onRecategorize && (
          <Button
            size="sm"
            variant={needsRecategorize ? "destructive" : "ghost"}
            onClick={(e) => {
              e.stopPropagation();
              onRecategorize();
            }}
            className="h-8 px-2"
            title={needsRecategorize ? "Fix category" : "Change category"}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 px-2 text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AIIntelligenceModal
        documentId={id}
        documentMimeType={mimeType}
        isOpen={intelligenceModalOpen}
        onClose={() => setIntelligenceModalOpen(false)}
      />
    </div>
  );
}
