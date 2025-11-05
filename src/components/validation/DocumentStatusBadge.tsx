import { ValidationStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface DocumentStatusBadgeProps {
  status: ValidationStatus;
  category?: string;
  confidence?: number;
  showCategory?: boolean;
  showConfidence?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const STATUS_CONFIG: Record<
  ValidationStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300",
    icon: Clock,
    description: "Document validation not yet started",
  },
  PROCESSING: {
    label: "Validating...",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-300",
    icon: Loader2,
    description: "AI agents currently validating document",
  },
  VERIFIED: {
    label: "Verified",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-300",
    icon: CheckCircle,
    description: "All validation checks passed",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-300",
    icon: AlertCircle,
    description: "Issues found that need staff review",
  },
  STAFF_APPROVED: {
    label: "Staff Approved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-300",
    icon: ShieldCheck,
    description: "Staff reviewed and approved",
  },
  REJECTED: {
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-300",
    icon: XCircle,
    description: "Validation failed or rejected",
  },
  ERROR: {
    label: "Error",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-300",
    icon: AlertTriangle,
    description: "Processing error occurred",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  IDENTITY: "Identity",
  PROOF_OF_RESIDENCE: "Residence",
  PATHOLOGY_REPORT: "Pathology",
  MEDICAL_RECORDS: "Medical",
  DISCHARGE_SUMMARY: "Discharge",
  TUMOR_REGISTRY: "Tumor Registry",
  TREATMENT_RECORDS: "Treatment",
  UTILITY_BILL: "Utility Bill",
  MORTGAGE_STATEMENT: "Mortgage",
  TAX_RETURN: "Tax Return",
  SCHOOL_RECORDS: "School",
  EMPLOYMENT_RECORDS: "Employment",
  OTHER: "Other",
};

export function DocumentStatusBadge({
  status,
  category,
  confidence,
  showCategory = false,
  showConfidence = false,
  size = "md",
  className,
}: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Format category label
  const categoryLabel = category ? CATEGORY_LABELS[category] || category : null;

  // Format confidence as percentage
  const confidencePercent =
    confidence !== undefined ? Math.round(confidence * 100) : null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        config.bgColor,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      <Icon
        className={cn(
          iconSizes[size],
          status === "PROCESSING" && "animate-spin"
        )}
      />
      <span>{config.label}</span>

      {showCategory && categoryLabel && (
        <>
          <span className="opacity-50">·</span>
          <span className="font-semibold">{categoryLabel}</span>
        </>
      )}

      {showConfidence && confidencePercent !== null && (
        <>
          <span className="opacity-50">·</span>
          <span className="font-mono text-xs">{confidencePercent}%</span>
        </>
      )}
    </span>
  );
}

/**
 * Get the status color for use in other components
 */
export function getStatusColor(status: ValidationStatus): string {
  return STATUS_CONFIG[status].color;
}

/**
 * Get the status background color for use in other components
 */
export function getStatusBgColor(status: ValidationStatus): string {
  return STATUS_CONFIG[status].bgColor;
}

/**
 * Check if a status indicates the document is usable
 */
export function isDocumentUsable(status: ValidationStatus): boolean {
  return status === "VERIFIED" || status === "STAFF_APPROVED";
}

/**
 * Check if a status indicates processing is complete
 */
export function isProcessingComplete(status: ValidationStatus): boolean {
  return (
    status !== "PENDING" &&
    status !== "PROCESSING"
  );
}
