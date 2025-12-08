"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClaimSubscriptionFlow } from "./ClaimSubscriptionFlow";

interface ClaimSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimantId: string;
  claimantName: string;
  onSuccess?: () => void;
}

/**
 * Dialog wrapper for ClaimSubscriptionFlow
 * Use this to show the subscription flow in a modal
 */
export function ClaimSubscriptionDialog({
  open,
  onOpenChange,
  claimantId,
  claimantName,
  onSuccess,
}: ClaimSubscriptionDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    // Close dialog after a short delay
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-2 border-cream-200 bg-white sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-sage-900">
            Subscribe to Claim Services
          </DialogTitle>
          <DialogDescription className="text-sage-600">
            Activate subscription for {claimantName}
          </DialogDescription>
        </DialogHeader>
        <ClaimSubscriptionFlow
          claimantId={claimantId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
