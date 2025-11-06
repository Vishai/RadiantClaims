"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Copy, Check } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  type: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  freeTrialDays: number | null;
  duration: string;
  durationInMonths: number | null;
  allowedTiers: string[];
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  stripeCouponId: string | null;
  notes: string | null;
  createdAt: string;
  subscriptions: Array<{
    id: string;
    userId: string;
    createdAt: string;
  }>;
}

interface CreatePromoCodeForm {
  code: string;
  type: string;
  description: string;
  percentOff: string;
  amountOff: string;
  freeTrialDays: string;
  duration: string;
  durationInMonths: string;
  allowedTiers: string[];
  maxUses: string;
  expiresInDays: string;
  createStripeCoupon: boolean;
  notes: string;
}

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    expiresInDays: "365",
    createStripeCoupon: true,
    notes: "",
  });

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/promo-codes");

      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      setError("Failed to load promo codes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      // Validate form
      if (!form.code) {
        throw new Error("Code is required");
      }

      if (
        form.type === "PERCENT_OFF" &&
        (!form.percentOff ||
          parseInt(form.percentOff) < 1 ||
          parseInt(form.percentOff) > 100)
      ) {
        throw new Error("Percent off must be between 1 and 100");
      }

      if (
        form.type === "AMOUNT_OFF" &&
        (!form.amountOff || parseFloat(form.amountOff) <= 0)
      ) {
        throw new Error("Amount off must be greater than 0");
      }

      if (
        form.type === "FREE_TRIAL" &&
        (!form.freeTrialDays || parseInt(form.freeTrialDays) <= 0)
      ) {
        throw new Error("Free trial days must be greater than 0");
      }

      // Calculate expiration date
      const expiresAt = form.expiresInDays
        ? new Date(
            Date.now() + parseInt(form.expiresInDays) * 24 * 60 * 60 * 1000
          ).toISOString()
        : null;

      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          type: form.type,
          description: form.description || null,
          percentOff: form.percentOff ? parseInt(form.percentOff) : null,
          amountOff: form.amountOff ? parseFloat(form.amountOff) : null,
          freeTrialDays: form.freeTrialDays
            ? parseInt(form.freeTrialDays)
            : null,
          duration: form.duration,
          durationInMonths:
            form.duration === "REPEATING" && form.durationInMonths
              ? parseInt(form.durationInMonths)
              : null,
          allowedTiers: form.allowedTiers,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt,
          createStripeCoupon: form.createStripeCoupon,
          notes: form.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create promo code");
      }

      const data = await response.json();
      setSuccess(`Promo code "${data.promoCode.code}" created successfully!`);
      setIsDialogOpen(false);

      // Reset form
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
        expiresInDays: "365",
        createStripeCoupon: true,
        notes: "",
      });

      // Refresh list
      fetchPromoCodes();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsCreating(false);
    }
  };

  const togglePromoCodeStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update promo code");
      }

      fetchPromoCodes();
    } catch (error) {
      console.error("Error updating promo code:", error);
      setError("Failed to update promo code status");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PERCENT_OFF":
        return "bg-blue-100 text-blue-800";
      case "AMOUNT_OFF":
        return "bg-green-100 text-green-800";
      case "PILOT_ACCOUNT":
        return "bg-purple-100 text-purple-800";
      case "WAIVE_SETUP":
        return "bg-yellow-100 text-yellow-800";
      case "FREE_TRIAL":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PERCENT_OFF":
        return "Percent Off";
      case "AMOUNT_OFF":
        return "Amount Off";
      case "PILOT_ACCOUNT":
        return "Pilot Account";
      case "WAIVE_SETUP":
        return "Waive Setup";
      case "FREE_TRIAL":
        return "Free Trial";
      default:
        return type;
    }
  };

  const getDiscountValue = (promoCode: PromoCode) => {
    let value = "";

    if (promoCode.percentOff) value = `${promoCode.percentOff}% off`;
    else if (promoCode.amountOff)
      value = `$${promoCode.amountOff.toFixed(2)} off`;
    else if (promoCode.freeTrialDays) value = `${promoCode.freeTrialDays} days`;
    else if (promoCode.type === "PILOT_ACCOUNT") value = "100% off";
    else if (promoCode.type === "WAIVE_SETUP") return "Setup fee waived";
    else value = "-";

    // Add duration info
    if (promoCode.duration === "REPEATING" && promoCode.durationInMonths) {
      value += ` (${promoCode.durationInMonths} mo)`;
    } else if (promoCode.duration === "FOREVER") {
      value += " (lifetime)";
    } else if (promoCode.duration === "ONCE") {
      value += " (once)";
    }

    return value;
  };

  const totalActive = promoCodes.filter((p) => p.isActive).length;
  const totalRedemptions = promoCodes.reduce(
    (sum, p) => sum + p.currentUses,
    0
  );
  const expiringSoon = promoCodes.filter(
    (p) =>
      p.isActive &&
      p.expiresAt &&
      new Date(p.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Promo Codes</h1>
          <p className="mt-2 text-sage-600">
            Create and manage discount codes, pilot accounts, and promotions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <form onSubmit={handleCreatePromoCode}>
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
                      <SelectItem value="WAIVE_SETUP">
                        Waive Setup Fee
                      </SelectItem>
                      <SelectItem value="PILOT_ACCOUNT">
                        Pilot Account
                      </SelectItem>
                      <SelectItem value="FREE_TRIAL">Free Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional fields based on type */}
                {form.type === "PERCENT_OFF" && (
                  <div className="space-y-2">
                    <Label htmlFor="percentOff">
                      Percent Off (1-100){" "}
                      <span className="text-red-500">*</span>
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

                {form.type === "AMOUNT_OFF" && (
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
                          Number of Months{" "}
                          <span className="text-red-500">*</span>
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
                    Allowed Service Paths{" "}
                    <span className="text-red-500">*</span>
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
                      <label
                        htmlFor="tier-legal"
                        className="text-sm font-medium"
                      >
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
                    onChange={(e) =>
                      setForm({ ...form, maxUses: e.target.value })
                    }
                  />
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
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
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
                  onClick={() => setIsDialogOpen(false)}
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
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && !isDialogOpen && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{promoCodes.length}</div>
            <p className="text-sm text-gray-600">Total Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {totalActive}
            </div>
            <p className="text-sm text-gray-600">Active Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {totalRedemptions}
            </div>
            <p className="text-sm text-gray-600">Total Redemptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {expiringSoon}
            </div>
            <p className="text-sm text-gray-600">Expiring Soon (7 days)</p>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
          <CardDescription>
            Manage all promo codes and their redemptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : promoCodes.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No promo codes found. Create your first promo code to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Discount</th>
                    <th className="pb-3 font-medium">Paths</th>
                    <th className="pb-3 font-medium">Usage</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Stripe</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promoCode) => {
                    const isExpired =
                      promoCode.expiresAt &&
                      new Date(promoCode.expiresAt) < new Date();
                    const isMaxedOut =
                      promoCode.maxUses &&
                      promoCode.currentUses >= promoCode.maxUses;

                    return (
                      <tr key={promoCode.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                              {promoCode.code}
                            </code>
                            <button
                              onClick={() => copyToClipboard(promoCode.code)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy code"
                            >
                              {copiedCode === promoCode.code ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge className={getTypeColor(promoCode.type)}>
                            {getTypeLabel(promoCode.type)}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm">
                          {getDiscountValue(promoCode)}
                        </td>
                        <td className="py-3 text-sm">
                          {promoCode.allowedTiers.length === 0 ? (
                            <span className="text-gray-400">All</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {promoCode.allowedTiers.includes("DIY_PREP") && (
                                <Badge className="bg-purple-100 text-xs text-purple-800">
                                  DIY
                                </Badge>
                              )}
                              {promoCode.allowedTiers.includes("LEGAL_REP") && (
                                <Badge className="bg-blue-100 text-xs text-blue-800">
                                  Legal
                                </Badge>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-sm">
                          <span
                            className={
                              isMaxedOut
                                ? "font-medium text-red-600"
                                : "text-gray-900"
                            }
                          >
                            {promoCode.currentUses}
                          </span>
                          {promoCode.maxUses && (
                            <span className="text-gray-500">
                              {" "}
                              / {promoCode.maxUses}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm">
                          {promoCode.expiresAt ? (
                            <span
                              className={
                                isExpired
                                  ? "text-red-600"
                                  : new Date(promoCode.expiresAt) <
                                      new Date(
                                        Date.now() + 7 * 24 * 60 * 60 * 1000
                                      )
                                    ? "text-orange-600"
                                    : "text-gray-600"
                              }
                            >
                              {new Date(
                                promoCode.expiresAt
                              ).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="py-3">
                          {promoCode.isActive && !isExpired && !isMaxedOut ? (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {promoCode.stripeCouponId ? "✓" : "-"}
                        </td>
                        <td className="py-3">
                          <Switch
                            checked={promoCode.isActive}
                            onCheckedChange={(checked) =>
                              togglePromoCodeStatus(promoCode.id, checked)
                            }
                            disabled={isExpired || isMaxedOut}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
