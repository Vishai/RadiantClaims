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
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AIIntelligenceModal } from "./AIIntelligenceModal";
import type { DocumentQualificationSummary } from "./types";
import { QUALIFICATION_COPY } from "./qualification-utils";
import { DocumentStatusBadge } from "@/components/validation";

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
    status: "PENDING" | "PROCESSING" | "VERIFIED" | "NEEDS_REVIEW" | "STAFF_APPROVED" | "REJECTED" | "ERROR";
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

function QualificationBadge({
  qualification,
}: {
  qualification: DocumentQualificationSummary;
}) {
  const config = QUALIFICATION_COPY[qualification.status];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-xs shadow-sm",
        config.className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">{config.icon}</span>
        <div className="flex-1 space-y-1">
          <p className="font-semibold uppercase tracking-wide">
            {config.label}
          </p>
          <p className="text-[11px] leading-relaxed opacity-80">
            {qualification.status === "QUALIFIES" &&
            qualification.matchedRequirementName
              ? `Satisfies: ${qualification.matchedRequirementName}`
              : config.description}
          </p>
          {qualification.suggestion && (
            <p className="text-[11px] leading-relaxed text-current">
              {qualification.suggestion}
            </p>
          )}
          {qualification.issues && qualification.issues.length > 0 && (
            <ul className="list-inside list-disc text-[11px] opacity-80">
              {qualification.issues.slice(0, 2).map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
              {qualification.issues.length > 2 && <li>More issues detected</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
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
  validation,
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType === "application/pdf") return FileText;
    return File;
  };

  const Icon = getFileIcon(mimeType);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return "Uncategorized";
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      UPLOADING: {
        label: "Uploading",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Clock,
      },
      PENDING: {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      },
      APPROVED: {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Rejected",
        className: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
      },
      NEEDS_ATTENTION: {
        label: "Needs Attention",
        className: "bg-orange-100 text-orange-700 border-orange-200",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const StatusIcon = config?.icon || Clock;

    return (
      <Badge
        variant="outline"
        className={cn("gap-1.5", config?.className || "")}
      >
        <StatusIcon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Thumbnail or Icon */}
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-sage-100">
              {thumbnailKey && !imageError ? (
                <Image
                  src={`/api/documents/${id}/thumbnail`}
                  alt={originalFilename}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Icon className="h-6 w-6 text-sage-600" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base text-sage-900">
                {originalFilename}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                {formatDate(uploadedAt)}
                <span>•</span>
                {formatFileSize(sizeBytes)}
              </CardDescription>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={onDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              {onRecategorize && (
                <DropdownMenuItem onClick={onRecategorize}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Change Category
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status & Badges - Single Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="border-sage-300 bg-sage-50 text-sage-700"
            >
              {getCategoryLabel(category)}
            </Badge>
            {categoryLocked && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700"
              >
                <Lock className="mr-1 h-3 w-3" /> Locked
              </Badge>
            )}
            {getStatusBadge(status)}
            {validation && (
              <DocumentStatusBadge
                status={validation.status}
                category={validation.category}
                confidence={validation.confidence}
                showCategory={false}
                showConfidence={validation.status === "VERIFIED"}
                size="sm"
              />
            )}
            {aiIntelligence && status === "READY" && (
              <Badge
                variant="outline"
                className="border-purple-300 bg-purple-50 text-purple-700"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI
              </Badge>
            )}
          </div>

          {qualification && (
            <QualificationBadge qualification={qualification} />
          )}
          {qualification?.userActionNeeded === "RECATEGORIZE" &&
            onRecategorize && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full border-dashed text-xs"
                onClick={(event) => {
                  event.stopPropagation();
                  onRecategorize();
                }}
              >
                Fix category now
              </Button>
            )}

          {/* Rejection Reason */}
          {status === "REJECTED" && rejectionReason && (
            <div className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">
              <p className="text-xs font-medium">Rejected:</p>
              <p className="mt-0.5 text-xs">{rejectionReason}</p>
            </div>
          )}

          {/* Actions - All in one row */}
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex-1"
                title="View Document"
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
                className="flex-1"
                title="Download"
              >
                <Download className="h-4 w-4" />
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
                className="flex-1 text-purple-600 hover:bg-purple-50"
                title="View AI Intelligence"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* AI Intelligence Modal */}
      <AIIntelligenceModal
        documentId={id}
        isOpen={intelligenceModalOpen}
        onClose={() => setIntelligenceModalOpen(false)}
      />
    </Card>
  );
}
