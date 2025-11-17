"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Resource {
  id: string;
  name: string;
  resourceType: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

interface Interaction {
  id: string;
  resource: {
    id: string;
    name: string;
    resourceType: string;
  };
  shownAt: string;
  followUpScheduledFor: string;
  followUpCompletedAt: string | null;
  hasFeedback: boolean;
}

export interface DocumentTrackingData {
  id?: string;
  documentType: string;
  status: string;
  requestedDate?: string | null;
  receivedDate?: string | null;
  uploadedDate?: string | null;
  notes?: string | null;
  resourceContacted?: Resource | null;
  interactions?: Interaction[];
}

interface DocumentTrackingCardProps {
  document: DocumentTrackingData;
  onStatusUpdate: (
    documentType: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  onUploadClick?: (documentType: string) => void;
}

const STATUS_CONFIG = {
  NOT_STARTED: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
    description: "You haven't started working on this document yet",
  },
  REQUESTED: {
    label: "Requested",
    color: "bg-blue-100 text-blue-700",
    icon: Mail,
    description: "You've contacted the office to request this document",
  },
  AWAITING: {
    label: "Awaiting Response",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    description: "Waiting to receive the document",
  },
  RECEIVED: {
    label: "Received",
    color: "bg-purple-100 text-purple-700",
    icon: FileText,
    description: "You've received the document",
  },
  UPLOADED: {
    label: "Uploaded",
    color: "bg-green-100 text-green-700",
    icon: Upload,
    description: "Document has been uploaded to your claim",
  },
  VERIFIED: {
    label: "Verified",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    description: "Document verified and approved",
  },
};

export function DocumentTrackingCard({
  document,
  onStatusUpdate,
  onUploadClick,
}: DocumentTrackingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(document.status);
  const [notes, setNotes] = useState(document.notes || "");

  const statusConfig =
    STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.NOT_STARTED;
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = async (newStatus: string) => {
    setSelectedStatus(newStatus);
    setIsUpdating(true);
    try {
      await onStatusUpdate(document.documentType, newStatus, notes);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(document.documentType, selectedStatus, notes);
    } catch (error) {
      console.error("Failed to update notes:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const daysWaiting = document.requestedDate
    ? Math.floor(
        (new Date().getTime() - new Date(document.requestedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              {document.documentType.replace(/_/g, " ")}
            </h3>
          </div>
          <Badge className={`${statusConfig.color} text-xs`}>
            {statusConfig.label}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      {daysWaiting !== null && document.status === "AWAITING" && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Waiting for {daysWaiting} days</span>
          {daysWaiting > 14 && (
            <AlertCircle className="h-3 w-3 text-yellow-600" />
          )}
        </div>
      )}

      {/* Resource contacted */}
      {document.resourceContacted && (
        <div className="mt-2 rounded-lg bg-gray-50 p-2">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-3 w-3 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {document.resourceContacted.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {document.resourceContacted.resourceType.replace(/_/g, " ")}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {document.resourceContacted.phone && (
                  <a
                    href={`tel:${document.resourceContacted.phone}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {document.resourceContacted.phone}
                  </a>
                )}
                {document.resourceContacted.website && (
                  <a
                    href={document.resourceContacted.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visit
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Update Status
            </label>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about your progress..."
              rows={2}
              className="text-xs"
            />
            {notes !== document.notes && (
              <Button
                size="sm"
                onClick={handleNotesUpdate}
                disabled={isUpdating}
                className="text-xs"
              >
                Save Notes
              </Button>
            )}
          </div>

          {/* Related interactions */}
          {document.interactions && document.interactions.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Resources Found ({document.interactions.length})
              </label>
              <div className="space-y-1">
                {document.interactions.slice(0, 3).map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {interaction.resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shown{" "}
                        {new Date(interaction.shownAt).toLocaleDateString()}
                      </p>
                    </div>
                    {interaction.hasFeedback && (
                      <CheckCircle2 className="ml-2 h-3 w-3 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {document.status === "RECEIVED" && (
              <Button
                size="sm"
                onClick={() => onUploadClick?.(document.documentType)}
                className="flex-1 text-xs"
              >
                <Upload className="mr-1 h-3 w-3" />
                Upload Document
              </Button>
            )}
            {document.status === "NOT_STARTED" &&
              !document.resourceContacted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // TODO: Open contact agent to find resource
                  }}
                  className="flex-1 text-xs"
                >
                  <Building2 className="mr-1 h-3 w-3" />
                  Find Where to Get This
                </Button>
              )}
          </div>

          {/* Timeline */}
          {(document.requestedDate ||
            document.receivedDate ||
            document.uploadedDate) && (
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium">Timeline</p>
              {document.requestedDate && (
                <p>
                  📤 Requested:{" "}
                  {new Date(document.requestedDate).toLocaleDateString()}
                </p>
              )}
              {document.receivedDate && (
                <p>
                  📥 Received:{" "}
                  {new Date(document.receivedDate).toLocaleDateString()}
                </p>
              )}
              {document.uploadedDate && (
                <p>
                  ✅ Uploaded:{" "}
                  {new Date(document.uploadedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
