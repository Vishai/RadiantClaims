"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Tier {
  id: string;
  tierOrder: number;
  startAfterUses: number;
  maxUsesInTier: number | null;
  percentOff: number | null;
  amountOff: number | null;
  description: string;
}

interface TierBuilderProps {
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
}

export function TierBuilder({ tiers, onChange }: TierBuilderProps) {
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newStartAfterUses = lastTier
      ? lastTier.startAfterUses + (lastTier.maxUsesInTier || 0)
      : 0;

    const newTier: Tier = {
      id: `tier-${Date.now()}`,
      tierOrder: tiers.length + 1,
      startAfterUses: newStartAfterUses,
      maxUsesInTier: null,
      percentOff: null,
      amountOff: null,
      description: "",
    };

    onChange([...tiers, newTier]);
  };

  const removeTier = (tierId: string) => {
    const updatedTiers = tiers
      .filter((t) => t.id !== tierId)
      .map((t, index) => ({
        ...t,
        tierOrder: index + 1,
      }));
    onChange(updatedTiers);
  };

  const updateTier = (tierId: string, updates: Partial<Tier>) => {
    const updatedTiers = tiers.map((t) =>
      t.id === tierId ? { ...t, ...updates } : t
    );
    onChange(updatedTiers);
  };

  const calculateUsageRange = (tier: Tier) => {
    const start = tier.startAfterUses + 1;
    if (!tier.maxUsesInTier) return `Use ${start}+`;
    const end = tier.startAfterUses + tier.maxUsesInTier;
    return `Uses ${start}-${end}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Discount Tiers</h3>
        <Button onClick={addTier} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Tier
        </Button>
      </div>

      {tiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pb-6 pt-6 text-center">
            <p className="mb-4 text-sm text-gray-500">
              No tiers added yet. Add your first tier to create a tiered
              discount campaign.
            </p>
            <Button onClick={addTier} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add First Tier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <Card key={tier.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base">
                      Tier {tier.tierOrder}
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      ({calculateUsageRange(tier)})
                    </span>
                  </div>
                  {tiers.length > 1 && (
                    <Button
                      onClick={() => removeTier(tier.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`tier-${tier.id}-maxUses`}>
                      Max Uses in This Tier
                    </Label>
                    <Input
                      id={`tier-${tier.id}-maxUses`}
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={tier.maxUsesInTier || ""}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          maxUsesInTier: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      Leave blank for unlimited uses in this tier
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`tier-${tier.id}-percentOff`}>
                      Discount (% off)
                    </Label>
                    <Input
                      id={`tier-${tier.id}-percentOff`}
                      type="number"
                      min="1"
                      max="100"
                      placeholder="50"
                      value={tier.percentOff || ""}
                      onChange={(e) =>
                        updateTier(tier.id, {
                          percentOff: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                          amountOff: null, // Clear amount off
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tier-${tier.id}-description`}>
                    Description (Optional)
                  </Label>
                  <Input
                    id={`tier-${tier.id}-description`}
                    placeholder="e.g., Early bird special"
                    value={tier.description}
                    onChange={(e) =>
                      updateTier(tier.id, { description: e.target.value })
                    }
                  />
                </div>

                {index === tiers.length - 1 && (
                  <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                    This is the final tier. Users after this tier will not
                    receive a discount.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tiers.length > 0 && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium">Tier Summary:</p>
          <ul className="space-y-1 text-sm text-gray-600">
            {tiers.map((tier) => (
              <li key={tier.id}>
                • {calculateUsageRange(tier)}: {tier.percentOff}% off
                {tier.description && ` - ${tier.description}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
