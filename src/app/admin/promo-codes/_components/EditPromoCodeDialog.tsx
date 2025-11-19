import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TierBuilder } from "@/components/admin/TierBuilder";
import { PromoCode } from "./types";

interface EditPromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promoCode: PromoCode | null;
  onUpdate: (updatedCode: PromoCode) => Promise<void>;
}

export function EditPromoCodeDialog({
  open,
  onOpenChange,
  promoCode,
  onUpdate,
}: EditPromoCodeDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null
  );

  useEffect(() => {
    setEditingPromoCode(promoCode);
  }, [promoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromoCode) return;

    setError(null);
    setIsUpdating(true);

    try {
      await onUpdate(editingPromoCode);
      // onOpenChange(false); // Handled by parent if successful, or we can do it here
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update promo code"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (!editingPromoCode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Promo Code: {editingPromoCode.code}</DialogTitle>
            <DialogDescription>
              Update promo code settings and tiers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-campaignName">Campaign Name</Label>
              <Input
                id="edit-campaignName"
                value={editingPromoCode.campaignName || ""}
                onChange={(e) =>
                  setEditingPromoCode({
                    ...editingPromoCode,
                    campaignName: e.target.value,
                  })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editingPromoCode.description || ""}
                onChange={(e) =>
                  setEditingPromoCode({
                    ...editingPromoCode,
                    description: e.target.value,
                  })
                }
              />
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="edit-maxUses">Max Uses</Label>
              <Input
                id="edit-maxUses"
                type="number"
                value={editingPromoCode.maxUses || ""}
                onChange={(e) =>
                  setEditingPromoCode({
                    ...editingPromoCode,
                    maxUses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-sage-200 bg-sage-50/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Soft-Open Access Override</Label>
                  <p className="text-sm text-sage-600">
                    {editingPromoCode.accessSeatsTotal
                      ? `Currently ${editingPromoCode.accessSeatsUsed}/${editingPromoCode.accessSeatsTotal} seats used`
                      : `${editingPromoCode.accessSeatsUsed} seats used`}
                  </p>
                </div>
                <Switch
                  id="edit-accessOverrideEnabled"
                  checked={editingPromoCode.accessOverrideEnabled}
                  onCheckedChange={(checked) =>
                    setEditingPromoCode({
                      ...editingPromoCode,
                      accessOverrideEnabled: checked,
                    })
                  }
                />
              </div>
              {editingPromoCode.accessOverrideEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="edit-accessSeatsTotal">
                    Seat Limit (blank = unlimited)
                  </Label>
                  <Input
                    id="edit-accessSeatsTotal"
                    type="number"
                    min="1"
                    value={
                      editingPromoCode.accessSeatsTotal !== null
                        ? editingPromoCode.accessSeatsTotal
                        : ""
                    }
                    onChange={(e) =>
                      setEditingPromoCode({
                        ...editingPromoCode,
                        accessSeatsTotal: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Tiers */}
            {editingPromoCode.useTieredDiscounts && (
              <TierBuilder
                tiers={
                  editingPromoCode.tiers?.map((t) => ({
                    id: t.id,
                    tierOrder: t.tierOrder,
                    startAfterUses: t.startAfterUses,
                    maxUsesInTier: t.maxUsesInTier,
                    percentOff: t.percentOff,
                    amountOff: t.amountOff,
                    description: t.description || "",
                  })) || []
                }
                onChange={(tiers) =>
                  setEditingPromoCode({
                    ...editingPromoCode,
                    tiers: tiers.map((t) => ({
                      id: t.id,
                      tierOrder: t.tierOrder,
                      startAfterUses: t.startAfterUses,
                      maxUsesInTier: t.maxUsesInTier,
                      percentOff: t.percentOff,
                      amountOff: t.amountOff,
                      description: t.description,
                    })),
                  })
                }
              />
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Internal Notes</Label>
              <Textarea
                id="edit-notes"
                value={editingPromoCode.notes || ""}
                onChange={(e) =>
                  setEditingPromoCode({
                    ...editingPromoCode,
                    notes: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Promo Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
