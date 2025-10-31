"use client";

import { useState } from "react";
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
  Mail,
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

interface DocumentCardProps {
  id: string;
  originalFilename: string;
  category?: string;
  status: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  thumbnailKey?: string | null;
  isRequired?: boolean;
  requiresOriginal?: boolean;
  rejectionReason?: string | null;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onRecategorize?: () => void;
  className?: string;
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
  isRequired = false,
  requiresOriginal = false,
  rejectionReason,
  onView,
  onDownload,
  onDelete,
  onRecategorize,
  className,
}: DocumentCardProps) {
  const [imageError, setImageError] = useState(false);

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
        "overflow-hidden transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {/* Thumbnail or Icon */}
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-sage-100">
              {thumbnailKey && !imageError ? (
                <img
                  src={`/api/documents/${id}/thumbnail`}
                  alt={originalFilename}
                  className="h-full w-full object-cover"
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
            <DropdownMenuTrigger asChild>
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
        <div className="space-y-2">
          {/* Category & Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-sage-300 bg-sage-50 text-sage-700"
            >
              {getCategoryLabel(category)}
            </Badge>
            {getStatusBadge(status)}
            {isRequired && (
              <Badge
                variant="outline"
                className="border-terracotta-300 bg-terracotta-50 text-terracotta-700"
              >
                Required
              </Badge>
            )}
            {requiresOriginal && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 bg-amber-50 text-amber-700"
              >
                <Mail className="h-3 w-3" />
                Original May Be Required
              </Badge>
            )}
          </div>

          {/* Rejection Reason */}
          {status === "REJECTED" && rejectionReason && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p className="font-medium">Rejection Reason:</p>
              <p className="mt-1 text-xs">{rejectionReason}</p>
            </div>
          )}

          {/* Original Document Notice */}
          {requiresOriginal && status === "APPROVED" && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4" />
                Original Typically Required
              </p>
              <p className="mt-1 text-xs">
                Documents in this category typically must be submitted as{" "}
                <strong>originals</strong> (not photocopies). Check current DOJ
                requirements before submitting your claim packet. Originals are
                returned after processing.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={onView}
                className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                <Eye className="mr-1 h-3 w-3" />
                View
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownload}
                className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                <Download className="mr-1 h-3 w-3" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
