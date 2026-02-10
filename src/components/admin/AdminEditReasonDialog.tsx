"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AdminEditReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  changedFieldsCount: number;
  isLoading?: boolean;
}

export default function AdminEditReasonDialog({
  open,
  onClose,
  onConfirm,
  changedFieldsCount,
  isLoading,
}: AdminEditReasonDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Form Edit</DialogTitle>
          <DialogDescription>
            You are about to modify {changedFieldsCount} field
            {changedFieldsCount !== 1 ? "s" : ""} in this application. Please
            provide a reason for this change.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label
            htmlFor="edit-reason"
            className="mb-1.5 block text-sm font-medium text-sage-700"
          >
            Reason for change <span className="text-red-500">*</span>
          </label>
          <textarea
            id="edit-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Corrected ZIP code per phone call with claimant"
            rows={3}
            className="w-full rounded-md border border-sage-300 px-3 py-2 text-sm shadow-sm focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
          />
          {reason.trim().length > 0 && reason.trim().length < 10 && (
            <p className="mt-1 text-xs text-amber-600">
              Please provide at least 10 characters ({10 - reason.trim().length}{" "}
              more needed)
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reason.trim().length < 10 || isLoading}
            className="bg-terracotta-600 hover:bg-terracotta-700"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
