"use client";

import { useEffect, useState } from "react";
import { PromoCodeStats } from "./_components/PromoCodeStats";
import { PromoCodesTable } from "./_components/PromoCodesTable";
import { CreatePromoCodeDialog } from "./_components/CreatePromoCodeDialog";
import { EditPromoCodeDialog } from "./_components/EditPromoCodeDialog";
import { CreatePromoCodeForm, PromoCode } from "./_components/types";

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCreatePromoCode = async (form: CreatePromoCodeForm) => {
    setError(null);
    setSuccess(null);

    // Validate form
    if (!form.code) {
      throw new Error("Code is required");
    }

    // Validate tiered discounts
    if (form.useTieredDiscounts) {
      if (form.tiers.length === 0) {
        throw new Error("At least one tier is required for tiered discounts");
      }
      // Validate each tier has a discount value
      for (const tier of form.tiers) {
        if (!tier.percentOff && !tier.amountOff) {
          throw new Error("Each tier must have a discount value");
        }
      }
    } else {
      // Standard validation for non-tiered discounts
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

    if (form.accessOverrideEnabled && form.accessSeatsTotal) {
      const seats = parseInt(form.accessSeatsTotal, 10);
      if (Number.isNaN(seats) || seats <= 0) {
        throw new Error("Access seat limit must be a positive number");
      }
    }

    const response = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        type: form.type,
        description: form.description || null,
        percentOff: form.percentOff ? parseInt(form.percentOff) : null,
        amountOff: form.amountOff ? parseFloat(form.amountOff) : null,
        freeTrialDays: form.freeTrialDays ? parseInt(form.freeTrialDays) : null,
        duration: form.duration,
        durationInMonths:
          form.duration === "REPEATING" && form.durationInMonths
            ? parseInt(form.durationInMonths)
            : null,
        allowedTiers: form.allowedTiers,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        accessOverrideEnabled: form.accessOverrideEnabled,
        accessSeatsTotal: form.accessSeatsTotal
          ? parseInt(form.accessSeatsTotal, 10)
          : null,
        expiresAt,
        createStripeCoupon: form.createStripeCoupon,
        notes: form.notes || null,
        campaignName: form.campaignName || null,
        useTieredDiscounts: form.useTieredDiscounts,
        tiers: form.useTieredDiscounts ? form.tiers : [],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to create promo code");
    }

    const data = await response.json();
    setSuccess(`Promo code "${data.promoCode.code}" created successfully!`);
    setIsDialogOpen(false);

    // Refresh list
    fetchPromoCodes();

    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleUpdatePromoCode = async (updatedCode: PromoCode) => {
    setError(null);
    setSuccess(null);

    if (
      updatedCode.accessOverrideEnabled &&
      updatedCode.accessSeatsTotal !== null &&
      updatedCode.accessSeatsTotal <= 0
    ) {
      throw new Error("Access seat limit must be greater than 0");
    }

    const updates: any = {
      id: updatedCode.id,
      description: updatedCode.description,
      maxUses: updatedCode.maxUses,
      expiresAt: updatedCode.expiresAt,
      notes: updatedCode.notes,
      campaignName: updatedCode.campaignName,
      accessOverrideEnabled: updatedCode.accessOverrideEnabled,
      accessSeatsTotal:
        updatedCode.accessSeatsTotal !== undefined
          ? updatedCode.accessSeatsTotal
          : undefined,
    };

    // Include tiers if this is a tiered promo code
    if (updatedCode.useTieredDiscounts && updatedCode.tiers) {
      updates.tiers = updatedCode.tiers.map((tier) => ({
        startAfterUses: tier.startAfterUses,
        maxUsesInTier: tier.maxUsesInTier,
        percentOff: tier.percentOff,
        amountOff: tier.amountOff,
        description: tier.description,
      }));
    }

    const response = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update promo code");
    }

    setSuccess(`Promo code "${updatedCode.code}" updated successfully!`);
    setIsEditDialogOpen(false);
    setEditingPromoCode(null);

    // Refresh list
    fetchPromoCodes();

    // Clear success message after 5 seconds
    setTimeout(() => setSuccess(null), 5000);
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Promo Codes</h1>
          <p className="mt-2 text-sage-600">
            Create and manage discount codes, pilot accounts, and promotions
          </p>
        </div>
        <CreatePromoCodeDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onCreate={handleCreatePromoCode}
        />
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && !isDialogOpen && !isEditDialogOpen && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <PromoCodeStats promoCodes={promoCodes} />

      {/* Promo Codes Table */}
      <PromoCodesTable
        promoCodes={promoCodes}
        isLoading={isLoading}
        onEdit={(code) => {
          setEditingPromoCode(code);
          setIsEditDialogOpen(true);
        }}
        onToggleStatus={togglePromoCodeStatus}
      />

      {/* Edit Promo Code Dialog */}
      <EditPromoCodeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        promoCode={editingPromoCode}
        onUpdate={handleUpdatePromoCode}
      />
    </div>
  );
}
