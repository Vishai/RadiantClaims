"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  aiIntelligence?: AIIntelligence;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRecategorize?: () => void;
}

export function DocumentListItem({
  originalFilename,
  category,
  status,
  sizeBytes,
  uploadedAt,
  mimeType,
  aiIntelligence,
  onView,
  onDownload,
  onDelete,
  onRecategorize,
}: DocumentListItemProps) {
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return "Uncategorized";
    return category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      UPLOADING: Clock,
      PROCESSING: Clock,
      READY: CheckCircle,
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      NEEDS_ATTENTION: AlertCircle,
      FAILED: XCircle,
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPLOADING: "text-blue-600",
      PROCESSING: "text-blue-600",
      READY: "text-emerald-600",
      PENDING: "text-amber-600",
      APPROVED: "text-emerald-600",
      REJECTED: "text-red-600",
      NEEDS_ATTENTION: "text-orange-600",
      FAILED: "text-red-600",
    };
    return colors[status] || "text-gray-600";
  };

  const StatusIcon = getStatusIcon(status);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-sage-200 bg-white p-3 transition-shadow hover:shadow-md">
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
            className={cn("h-4 w-4 flex-shrink-0", getStatusColor(status))}
          />
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-sage-600">
          <span>{getCategoryLabel(category)}</span>
          <span>•</span>
          <span>{formatFileSize(sizeBytes)}</span>
          <span>•</span>
          <span>{formatDate(uploadedAt)}</span>
        </div>
      </div>

      {/* AI Intelligence - Inline */}
      {aiIntelligence && status === "READY" && (
        <div className="flex flex-shrink-0 items-center gap-2">
          {aiIntelligence.ocrConfidence !== undefined && (
            <Badge
              variant="outline"
              className="border-indigo-300 bg-indigo-50 text-indigo-700"
            >
              {(aiIntelligence.ocrConfidence * 100).toFixed(0)}% OCR
            </Badge>
          )}
          {aiIntelligence.tags && aiIntelligence.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {aiIntelligence.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.tag}
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700"
                  title={`${(tag.confidence * 100).toFixed(0)}% confidence`}
                >
                  {tag.tag.replace(/_/g, " ")}
                </Badge>
              ))}
              {aiIntelligence.tags.length > 2 && (
                <Badge
                  variant="outline"
                  className="border-gray-300 bg-gray-50 text-gray-600"
                >
                  +{aiIntelligence.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {onView && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onView}
            className="h-8 px-2"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onDownload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            className="h-8 px-2"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {onRecategorize && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRecategorize}
            className="h-8 px-2"
            title="Change Category"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 px-2 text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
