"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Pencil,
  Eye,
  RefreshCw,
  FileCheck,
  FileX,
  MessageSquare,
} from "lucide-react";

interface StaffAction {
  id: string;
  actionType: string;
  actionData: any;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AdminSessionAuditLogProps {
  staffActions: StaffAction[];
}

const ACTION_LABELS: Record<
  string,
  { label: string; color: string; icon: typeof Pencil }
> = {
  VIEWED_CLAIM: {
    label: "Viewed Claim",
    color: "bg-gray-100 text-gray-700",
    icon: Eye,
  },
  STARTED_REVIEW: {
    label: "Started Review",
    color: "bg-blue-100 text-blue-700",
    icon: Eye,
  },
  EDITED_FORM_DATA: {
    label: "Edited Form Data",
    color: "bg-amber-100 text-amber-700",
    icon: Pencil,
  },
  REGENERATED_PACKET: {
    label: "Regenerated Packet",
    color: "bg-purple-100 text-purple-700",
    icon: RefreshCw,
  },
  APPROVED_DOCUMENT: {
    label: "Approved Document",
    color: "bg-green-100 text-green-700",
    icon: FileCheck,
  },
  REJECTED_DOCUMENT: {
    label: "Rejected Document",
    color: "bg-red-100 text-red-700",
    icon: FileX,
  },
  APPROVED_CLAIM: {
    label: "Approved Claim",
    color: "bg-green-100 text-green-700",
    icon: FileCheck,
  },
  REJECTED_CLAIM: {
    label: "Rejected Claim",
    color: "bg-red-100 text-red-700",
    icon: FileX,
  },
  ADDED_NOTE: {
    label: "Added Note",
    color: "bg-blue-100 text-blue-700",
    icon: MessageSquare,
  },
  REQUESTED_DOCUMENTS: {
    label: "Requested Documents",
    color: "bg-amber-100 text-amber-700",
    icon: FileCheck,
  },
  OVERRODE_AI: {
    label: "Overrode AI",
    color: "bg-purple-100 text-purple-700",
    icon: Pencil,
  },
  ASSIGNED_CLAIM: {
    label: "Assigned Claim",
    color: "bg-blue-100 text-blue-700",
    icon: Eye,
  },
  CONTACTED_CLAIMANT: {
    label: "Contacted Claimant",
    color: "bg-blue-100 text-blue-700",
    icon: MessageSquare,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName(user: StaffAction["user"]): string {
  if (user.name) {
    return user.name;
  }
  return user.email;
}

export default function AdminSessionAuditLog({
  staffActions,
}: AdminSessionAuditLogProps) {
  if (!staffActions || staffActions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sage-500">
          No staff actions recorded for this session yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {staffActions.map((action) => {
        const actionInfo = ACTION_LABELS[action.actionType] || {
          label: action.actionType.replace(/_/g, " "),
          color: "bg-gray-100 text-gray-700",
          icon: Clock,
        };
        const Icon = actionInfo.icon;
        const actionData = action.actionData as any;

        return (
          <Card key={action.id}>
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4 text-sage-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${actionInfo.color}`}>
                        {actionInfo.label}
                      </Badge>
                      <span className="text-sm text-sage-700">
                        by {getUserName(action.user)}
                      </span>
                    </div>

                    {action.notes && (
                      <p className="text-sm text-sage-600">{action.notes}</p>
                    )}

                    {/* Show changed fields for form edits */}
                    {action.actionType === "EDITED_FORM_DATA" &&
                      actionData?.changedFields && (
                        <div className="mt-1 space-y-0.5 text-xs text-sage-500">
                          <p className="font-medium">
                            {actionData.changedFields.length} field
                            {actionData.changedFields.length !== 1
                              ? "s"
                              : ""}{" "}
                            changed:
                          </p>
                          {actionData.changedFields
                            .slice(0, 5)
                            .map((change: any, i: number) => (
                              <p key={i} className="pl-2">
                                {change.part}.{change.field}:{" "}
                                <span className="text-red-400 line-through">
                                  {typeof change.oldValue === "object"
                                    ? JSON.stringify(change.oldValue)
                                    : String(change.oldValue ?? "empty")}
                                </span>{" "}
                                &rarr;{" "}
                                <span className="text-green-600">
                                  {typeof change.newValue === "object"
                                    ? JSON.stringify(change.newValue)
                                    : String(change.newValue)}
                                </span>
                              </p>
                            ))}
                          {actionData.changedFields.length > 5 && (
                            <p className="pl-2 text-sage-400">
                              ...and {actionData.changedFields.length - 5} more
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-sage-400">
                  {formatDate(action.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
