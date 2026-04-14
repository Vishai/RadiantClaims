"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Sparkles,
  Lock,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface DocumentCardProps {
  id: string;
  originalFilename: string;
  category?: string;
  categoryLocked?: boolean;
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  thumbnailKey?: string | null;
  isRequired?: boolean;
  requiresOriginal?: boolean;
  rejectionReason?: string | null;
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
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRecategorize?: () => void;
  className?: string;
  qualification?: DocumentQualificationSummary | null;
}

export function DocumentCard({
  id,
  originalFilename,
  category,
  status,
  sizeBytes,
  uploadedAt,
  mimeType,
  thumbnailKey,
  rejectionReason,
  aiIntelligence,
  onView,
  onDownload,
  onDelete,
  onRecategorize,
  className,
  categoryLocked,
  qualification,
}: DocumentCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [intelligenceModalOpen, setIntelligenceModalOpen] = useState(false);

  const handleCardClick = () => {
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
      year: "numeric",
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
    const configs: Record<string, { label: string; color: string; icon: any }> =
      {
        UPLOADING: { label: "Uploading", color: "text-blue-600", icon: Clock },
        PROCESSING: {
          label: "Processing",
          color: "text-blue-600",
          icon: Clock,
        },
        READY: {
          label: "Ready",
          color: "text-emerald-600",
          icon: CheckCircle,
        },
        FAILED: { label: "Failed", color: "text-red-600", icon: XCircle },
        APPROVED: {
          label: "Approved",
          color: "text-emerald-600",
          icon: CheckCircle,
        },
        REJECTED: { label: "Rejected", color: "text-red-600", icon: XCircle },
      };
    return configs[s] || { label: s, color: "text-gray-600", icon: Clock };
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const qualificationCopy = qualification
    ? QUALIFICATION_COPY[qualification.status]
    : null;

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Top row: icon + name + menu */}
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-sage-100">
              {thumbnailKey && !imageError ? (
                <Image
                  src={`/api/documents/${id}/thumbnail`}
                  alt={originalFilename}
                  fill
                  sizes="40px"
                  className="object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon className="h-5 w-5 text-sage-600" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-sage-900">
                {originalFilename}
              </h3>
              <p className="text-xs text-sage-500">
                {formatDate(uploadedAt)} &middot; {formatFileSize(sizeBytes)}
              </p>
            </div>

            {/* Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                {onView && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onView();
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View PDF
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                )}
                {onRecategorize && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecategorize();
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Change Category
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Category + Status row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-sage-300 bg-sage-50 text-xs text-sage-700"
            >
              {getCategoryLabel(category)}
            </Badge>
            {categoryLocked && <Lock className="h-3 w-3 text-amber-500" />}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                statusConfig.color
              )}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{statusConfig.label}</span>
            </div>
            {qualification?.categoryMismatch && (
              <AlertTriangle className="h-3 w-3 animate-pulse text-red-500" />
            )}
            {aiIntelligence && status === "READY" && (
              <Sparkles className="h-3 w-3 text-purple-500" />
            )}
          </div>

          {/* Qualification summary (compact) — suppress green if issues exist */}
          {qualificationCopy &&
            qualification &&
            (() => {
              const hasIssues =
                qualification.issues && qualification.issues.length > 0;
              const needsAction =
                qualification.userActionNeeded !== "NONE" &&
                qualification.userActionNeeded;
              // If qualification says "QUALIFIES" but there are issues, show a cautious amber instead of green
              const showCautious =
                qualification.status === "QUALIFIES" &&
                (hasIssues || needsAction);

              return (
                <div
                  className={cn(
                    "rounded-md border px-3 py-2 text-xs",
                    showCautious
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : qualificationCopy.className
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {showCautious ? "\u{1F7E1}" : qualificationCopy.icon}
                    </span>
                    <span className="font-semibold">
                      {showCautious ? "Needs Review" : qualificationCopy.label}
                    </span>
                  </div>
                  {hasIssues && (
                    <p className="mt-1 text-[11px] opacity-80">
                      {qualification.issues![0]}
                      {qualification.issues!.length > 1 &&
                        ` (+${qualification.issues!.length - 1} more)`}
                    </p>
                  )}
                </div>
              );
            })()}

          {/* Rejection reason */}
          {status === "REJECTED" && rejectionReason && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-medium">Rejected:</span> {rejectionReason}
            </div>
          )}

          {/* Action buttons */}
          <div
            className="flex gap-1 border-t border-sage-100 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="h-8 flex-1 text-xs"
                title="View PDF"
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                View
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
                className="h-8 flex-1 text-xs"
                title="Download"
              >
                <Download className="mr-1 h-3.5 w-3.5" />
              </Button>
            )}
            {status === "READY" && aiIntelligence && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIntelligenceModalOpen(true);
                }}
                className="h-8 flex-1 text-xs text-purple-600 hover:bg-purple-50"
                title="AI Analysis"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                AI
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <AIIntelligenceModal
        documentId={id}
        documentMimeType={mimeType}
        isOpen={intelligenceModalOpen}
        onClose={() => setIntelligenceModalOpen(false)}
      />
    </Card>
  );
}
