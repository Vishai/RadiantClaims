"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DOJClaimInfo {
  claimantId: string;
  claimantName: string;
  dojClaimNumber: string | null;
  currentMilestone: string;
  submittedToDOJAt: string | null;
  receivedByDOJAt: string | null;
}

interface DOJClaimNumberManagerProps {
  claimantId: string;
  allowEdit?: boolean;
  allowDelete?: boolean;
  onUpdate?: () => void;
}

/**
 * Component for managing DOJ claim numbers
 * - View current DOJ claim number
 * - Add/update DOJ claim number
 * - Track when DOJ received the claim
 */
export function DOJClaimNumberManager({
  claimantId,
  allowEdit = true,
  allowDelete = false,
  onUpdate,
}: DOJClaimNumberManagerProps) {
  const [claimInfo, setClaimInfo] = useState<DOJClaimInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [dojClaimNumber, setDojClaimNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadClaimInfo();
  }, [claimantId]);

  const loadClaimInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/claims/${claimantId}/doj-claim-number`
      );

      if (!response.ok) {
        throw new Error("Failed to load DOJ claim information");
      }

      const data = await response.json();
      setClaimInfo(data);

      // Pre-fill form if editing existing claim number
      if (data.dojClaimNumber) {
        setDojClaimNumber(data.dojClaimNumber);
      }
      if (data.receivedByDOJAt) {
        setReceivedDate(data.receivedByDOJAt.split("T")[0] || "");
      } else {
        setReceivedDate("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!dojClaimNumber.trim()) {
      setError("DOJ claim number is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/claims/${claimantId}/doj-claim-number`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dojClaimNumber: dojClaimNumber.trim(),
            receivedByDOJAt: receivedDate || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update DOJ claim number");
      }

      await loadClaimInfo();
      setEditMode(false);
      setSuccess("DOJ claim number updated successfully");

      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(
        `/api/claims/${claimantId}/doj-claim-number`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove DOJ claim number");
      }

      await loadClaimInfo();
      setDeleteDialogOpen(false);
      setSuccess("DOJ claim number removed successfully");

      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setError(null);
    // Reset form to current values
    if (claimInfo?.dojClaimNumber) {
      setDojClaimNumber(claimInfo.dojClaimNumber);
    }
    if (claimInfo?.receivedByDOJAt) {
      setReceivedDate(claimInfo.receivedByDOJAt.split("T")[0] || "");
    } else {
      setReceivedDate("");
    }
  };

  if (loading) {
    return (
      <Card className="rounded-3xl border-2 border-cream-200 bg-white">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-3xl border-2 border-cream-200 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <FileText className="h-5 w-5" />
                DOJ Claim Number
              </CardTitle>
              <CardDescription className="text-sage-600">
                Official claim ID assigned by the Department of Justice
              </CardDescription>
            </div>
            {claimInfo?.dojClaimNumber && !editMode && (
              <div className="flex gap-2">
                {allowEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {allowDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {!claimInfo?.dojClaimNumber && !editMode ? (
            // No claim number assigned yet
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-12 w-12 text-amber-600" />
                <p className="font-semibold text-amber-900">
                  No DOJ Claim Number Yet
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  The DOJ will assign a claim number after reviewing your packet
                </p>
              </div>

              {allowEdit && (
                <Button
                  onClick={() => setEditMode(true)}
                  className="w-full rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                >
                  Add DOJ Claim Number
                </Button>
              )}
            </div>
          ) : editMode ? (
            // Edit mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dojClaimNumber" className="text-sage-900">
                  DOJ Claim Number *
                </Label>
                <Input
                  id="dojClaimNumber"
                  value={dojClaimNumber}
                  onChange={(e) => setDojClaimNumber(e.target.value)}
                  placeholder="e.g., DOJ-2024-12345"
                  className="rounded-xl border-cream-300"
                />
                <p className="text-xs text-sage-600">
                  Enter the official claim number provided by the DOJ
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate" className="text-sage-900">
                  Date Received by DOJ
                </Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="rounded-xl border-cream-300"
                />
                <p className="text-xs text-sage-600">
                  Optional: When the DOJ confirmed receipt
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                  disabled={saving || !dojClaimNumber.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // View mode - showing existing claim number
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Claim Number Assigned
                    </p>
                    <p className="mt-2 font-mono text-2xl font-bold text-green-900">
                      {claimInfo?.dojClaimNumber}
                    </p>
                  </div>
                </div>
              </div>

              {claimInfo?.receivedByDOJAt && (
                <div className="flex items-center gap-3 rounded-lg border border-sage-200 bg-sage-50 p-4">
                  <Calendar className="h-5 w-5 text-sage-700" />
                  <div>
                    <p className="text-sm font-medium text-sage-900">
                      Received by DOJ
                    </p>
                    <p className="text-sm text-sage-700">
                      {new Date(claimInfo.receivedByDOJAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>What's next?</strong> Use this claim number to:
                </p>
                <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-blue-800">
                  <li>Check your claim status on the DOJ website</li>
                  <li>Communicate with DOJ staff about your claim</li>
                  <li>Track your claim's progress through the system</li>
                  <li>Submit additional documentation if requested</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border-2 border-cream-200 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sage-900">
              Remove DOJ Claim Number?
            </DialogTitle>
            <DialogDescription className="text-sage-600">
              Are you sure you want to remove this DOJ claim number? This action
              can be undone by re-adding the number.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <p className="font-mono text-lg font-semibold text-amber-900">
              {claimInfo?.dojClaimNumber}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
