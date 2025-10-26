import { ClaimantWorkflowStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Printer,
  Mail,
  Send,
  Clock,
  CheckCheck,
  XCircle,
  Ban,
} from "lucide-react";

interface WorkflowStatusBadgeProps {
  status: ClaimantWorkflowStatus;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<
  ClaimantWorkflowStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  INTAKE: {
    label: "Intake",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300",
    icon: FileText,
    description: "Claimant filling out intake form",
  },
  DOCUMENTS_PENDING: {
    label: "Documents Pending",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-300",
    icon: Upload,
    description: "Waiting for document uploads",
  },
  INTERNAL_REVIEW: {
    label: "Internal Review",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-300",
    icon: Search,
    description: "Radiant Claims staff reviewing",
  },
  READY_FOR_ATTORNEY: {
    label: "Ready for Review",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-300",
    icon: Eye,
    description: "Ready for attorney review",
  },
  ATTORNEY_REVIEWING: {
    label: "Under Review",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-300",
    icon: Search,
    description: "Attorney actively reviewing",
  },
  REVISION_REQUESTED: {
    label: "Revision Requested",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-300",
    icon: AlertCircle,
    description: "Attorney requested changes",
  },
  ATTORNEY_APPROVED: {
    label: "Attorney Approved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-300",
    icon: CheckCircle,
    description: "Attorney approved for submission",
  },
  PACKET_PRINTED: {
    label: "Packet Printed",
    color: "text-teal-700",
    bgColor: "bg-teal-50 border-teal-300",
    icon: Printer,
    description: "Physical packet printed",
  },
  MAILING_READY: {
    label: "Ready to Mail",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 border-cyan-300",
    icon: Mail,
    description: "Ready for client to mail",
  },
  CLIENT_MAILED: {
    label: "Client Mailed",
    color: "text-sky-700",
    bgColor: "bg-sky-50 border-sky-300",
    icon: Send,
    description: "Client confirmed mailing",
  },
  DOJ_SUBMITTED: {
    label: "DOJ Submitted",
    color: "text-violet-700",
    bgColor: "bg-violet-50 border-violet-300",
    icon: Send,
    description: "Submitted to Department of Justice",
  },
  DOJ_PROCESSING: {
    label: "DOJ Processing",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-300",
    icon: Clock,
    description: "DOJ is processing the claim",
  },
  APPROVED: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-300",
    icon: CheckCheck,
    description: "DOJ approved the claim",
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-300",
    icon: XCircle,
    description: "DOJ rejected the claim",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300",
    icon: Ban,
    description: "Claim was withdrawn",
  },
};

export function WorkflowStatusBadge({
  status,
  className,
  showIcon = true,
  size = "md",
}: WorkflowStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.color,
        config.bgColor,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

/**
 * Get the next status in the workflow
 */
export function getNextWorkflowStatus(
  currentStatus: ClaimantWorkflowStatus
): ClaimantWorkflowStatus | null {
  const workflow: ClaimantWorkflowStatus[] = [
    "INTAKE",
    "DOCUMENTS_PENDING",
    "INTERNAL_REVIEW",
    "READY_FOR_ATTORNEY",
    "ATTORNEY_REVIEWING",
    "ATTORNEY_APPROVED",
    "PACKET_PRINTED",
    "MAILING_READY",
    "CLIENT_MAILED",
    "DOJ_SUBMITTED",
    "DOJ_PROCESSING",
    "APPROVED",
  ];

  const currentIndex = workflow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }

  return workflow[currentIndex + 1] || null;
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(status: ClaimantWorkflowStatus): number {
  const statusValues: Record<ClaimantWorkflowStatus, number> = {
    INTAKE: 5,
    DOCUMENTS_PENDING: 15,
    INTERNAL_REVIEW: 25,
    READY_FOR_ATTORNEY: 35,
    ATTORNEY_REVIEWING: 45,
    REVISION_REQUESTED: 40, // Slight step back
    ATTORNEY_APPROVED: 60,
    PACKET_PRINTED: 70,
    MAILING_READY: 80,
    CLIENT_MAILED: 85,
    DOJ_SUBMITTED: 90,
    DOJ_PROCESSING: 95,
    APPROVED: 100,
    REJECTED: 100,
    WITHDRAWN: 0,
  };

  return statusValues[status] || 0;
}
