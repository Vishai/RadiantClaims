"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewClaimFlow } from "./NewClaimFlow";

interface NewClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingClaimCount: number;
}

/**
 * Dialog wrapper for the New Claim Flow
 *
 * Opens in a modal when user clicks "Start New Claim" button
 */
export function NewClaimDialog({
  open,
  onOpenChange,
  existingClaimCount,
}: NewClaimDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Start New Claim</DialogTitle>
          <DialogDescription className="sr-only">
            Complete eligibility check and payment to file a new RECA claim
          </DialogDescription>
        </DialogHeader>
        <NewClaimFlow
          existingClaimCount={existingClaimCount}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
