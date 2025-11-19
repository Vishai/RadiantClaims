import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { TierBuilder } from "@/components/admin/TierBuilder";
import { CreatePromoCodeForm } from "./types";

interface CreatePromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (form: CreatePromoCodeForm) => Promise<void>;
}

export function CreatePromoCodeDialog({
  open,
  onOpenChange,
  onCreate,
}: CreatePromoCodeDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePromoCodeForm>({
    code: "",
    type: "PERCENT_OFF",
    description: "",
    percentOff: "",
    amountOff: "",
    freeTrialDays: "",
    duration: "ONCE",
    durationInMonths: "",
    allowedTiers: ["DIY_PREP"], // Default to DIY only
    maxUses: "1",
    accessOverrideEnabled: false,
    accessSeatsTotal: "",
    expiresInDays: "365",
    createStripeCoupon: true,
    notes: "",
    campaignName: "",
    useTieredDiscounts: false,
    tiers: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      await onCreate(form);
      // Reset form on success (parent closes dialog)
      setForm({
        code: "",
        type: "PERCENT_OFF",
        description: "",
        percentOff: "",
        amountOff: "",
        freeTrialDays: "",
        duration: "ONCE",
        durationInMonths: "",
        allowedTiers: ["DIY_PREP"],
        maxUses: "1",
        accessOverrideEnabled: false,
        accessSeatsTotal: "",
        expiresInDays: "365",
        createStripeCoupon: true,
        notes: "",
        campaignName: "",
        useTieredDiscounts: false,
        tiers: [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create promo code"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Promo Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Create a new promo code for discounts or pilot accounts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g., SAVE50, PILOT2025"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT_OFF">Percent Off</SelectItem>
                  <SelectItem value="AMOUNT_OFF">Amount Off</SelectItem>
                  <SelectItem value="WAIVE_SETUP">Waive Setup Fee</SelectItem>
                  <SelectItem value="PILOT_ACCOUNT">Pilot Account</SelectItem>
                  <SelectItem value="FREE_TRIAL">Free Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on type */}
            {form.type === "PERCENT_OFF" && !form.useTieredDiscounts && (
              <div className="space-y-2">
                <Label htmlFor="percentOff">
                  Percent Off (1-100) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="percentOff"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="50"
                  value={form.percentOff}
                  onChange={(e) =>
                    setForm({ ...form, percentOff: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {form.type === "AMOUNT_OFF" && !form.useTieredDiscounts && (
              <div className="space-y-2">
                <Label htmlFor="amountOff">
                  Amount Off ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amountOff"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="20.00"
                  value={form.amountOff}
                  onChange={(e) =>
                    setForm({ ...form, amountOff: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Tiered Discount Builder */}
            {form.useTieredDiscounts &&
              (form.type === "PERCENT_OFF" || form.type === "AMOUNT_OFF") && (
                <TierBuilder
                  tiers={form.tiers}
                  onChange={(tiers) => setForm({ ...form, tiers })}
                />
              )}

            {form.type === "FREE_TRIAL" && (
              <div className="space-y-2">
                <Label htmlFor="freeTrialDays">
                  Free Trial Days <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="freeTrialDays"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={form.freeTrialDays}
                  onChange={(e) =>
                    setForm({ ...form, freeTrialDays: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., 50% off for early adopters"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign Name (Optional)</Label>
              <Input
                id="campaignName"
                placeholder="e.g., Black Friday 2025"
                value={form.campaignName}
                onChange={(e) =>
                  setForm({ ...form, campaignName: e.target.value })
                }
              />
              <p className="text-sm text-gray-500">
                Group related promo codes under a campaign
              </p>
            </div>

            {/* Tiered Discounts Toggle */}
            {(form.type === "PERCENT_OFF" || form.type === "AMOUNT_OFF") && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useTieredDiscounts"
                    checked={form.useTieredDiscounts}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, useTieredDiscounts: checked })
                    }
                  />
                  <Label htmlFor="useTieredDiscounts">
                    Use Tiered Discounts
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Apply different discount amounts based on usage count
                </p>
              </div>
            )}

            {/* Duration / Term */}
            {(form.type === "PERCENT_OFF" ||
              form.type === "AMOUNT_OFF" ||
              form.type === "PILOT_ACCOUNT") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duration <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.duration}
                    onValueChange={(value) =>
                      setForm({ ...form, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">
                        Once (first payment only)
                      </SelectItem>
                      <SelectItem value="REPEATING">
                        Repeating (for X months)
                      </SelectItem>
                      <SelectItem value="FOREVER">
                        Forever (lifetime discount)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.duration === "REPEATING" && (
                  <div className="space-y-2">
                    <Label htmlFor="durationInMonths">
                      Number of Months <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="durationInMonths"
                      type="number"
                      min="1"
                      max="36"
                      placeholder="12"
                      value={form.durationInMonths}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationInMonths: e.target.value,
                        })
                      }
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Discount will apply for this many months
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Allowed Service Tiers (Path Restrictions) */}
            <div className="space-y-2">
              <Label>
                Allowed Service Paths <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tier-diy"
                    checked={form.allowedTiers.includes("DIY_PREP")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({
                          ...form,
                          allowedTiers: [...form.allowedTiers, "DIY_PREP"],
                        });
                      } else {
                        setForm({
                          ...form,
                          allowedTiers: form.allowedTiers.filter(
                            (t) => t !== "DIY_PREP"
                          ),
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="tier-diy" className="text-sm font-medium">
                    DIY Document Preparation ($149.99 + $24.99/mo)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tier-legal"
                    checked={form.allowedTiers.includes("LEGAL_REP")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({
                          ...form,
                          allowedTiers: [...form.allowedTiers, "LEGAL_REP"],
                        });
                      } else {
                        setForm({
                          ...form,
                          allowedTiers: form.allowedTiers.filter(
                            (t) => t !== "LEGAL_REP"
                          ),
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="tier-legal" className="text-sm font-medium">
                    Legal Representation (Attorney Path)
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Select which subscription paths can use this promo code
                </p>
              </div>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses (blank = unlimited)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="100"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>

            {/* Access Override */}
            <div className="space-y-3 rounded-2xl border border-sage-200 bg-sage-50/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Soft-Open Access Override</Label>
                  <p className="text-sm text-sage-600">
                    Allow this code to bypass the registration freeze. Great for
                    limited-seat beta invites.
                  </p>
                </div>
                <Switch
                  id="accessOverrideEnabled"
                  checked={form.accessOverrideEnabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, accessOverrideEnabled: checked })
                  }
                />
              </div>
              {form.accessOverrideEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="accessSeatsTotal">
                    Seat Limit (blank = unlimited)
                  </Label>
                  <Input
                    id="accessSeatsTotal"
                    type="number"
                    min="1"
                    placeholder="25"
                    value={form.accessSeatsTotal}
                    onChange={(e) =>
                      setForm({ ...form, accessSeatsTotal: e.target.value })
                    }
                  />
                  <p className="text-sm text-sage-600">
                    Each seat equals one account that can register while
                    registrations are closed.
                  </p>
                </div>
              )}
            </div>

            {/* Expires In Days */}
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">
                Expires In Days (blank = never)
              </Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                placeholder="365"
                value={form.expiresInDays}
                onChange={(e) =>
                  setForm({ ...form, expiresInDays: e.target.value })
                }
              />
            </div>

            {/* Create Stripe Coupon */}
            {(form.type === "PERCENT_OFF" ||
              form.type === "AMOUNT_OFF" ||
              form.type === "PILOT_ACCOUNT") && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="createStripeCoupon"
                  checked={form.createStripeCoupon}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, createStripeCoupon: checked })
                  }
                />
                <Label htmlFor="createStripeCoupon">
                  Create Stripe Coupon (recommended)
                </Label>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes for admins only"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Promo Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
