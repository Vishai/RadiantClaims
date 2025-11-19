import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import { PromoCode } from "./types";
import { getDiscountValue, getTypeColor, getTypeLabel } from "./utils";
import { useState } from "react";

interface PromoCodesTableProps {
  promoCodes: PromoCode[];
  isLoading: boolean;
  onEdit: (promoCode: PromoCode) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function PromoCodesTable({
  promoCodes,
  isLoading,
  onEdit,
  onToggleStatus,
}: PromoCodesTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
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
                  const expiresAtDate = promoCode.expiresAt
                    ? new Date(promoCode.expiresAt)
                    : null;
                  const isExpired =
                    !!expiresAtDate && expiresAtDate < new Date();
                  const isMaxedOut =
                    typeof promoCode.maxUses === "number" &&
                    promoCode.currentUses >= promoCode.maxUses;

                  return (
                    <tr
                      key={promoCode.id}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-gray-50"
                      onClick={() => onEdit(promoCode)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                            {promoCode.code}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(promoCode.code);
                            }}
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
                        {promoCode.accessOverrideEnabled && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Access Seats: {promoCode.accessSeatsUsed}
                              {promoCode.accessSeatsTotal
                                ? ` / ${promoCode.accessSeatsTotal}`
                                : " / ∞"}
                            </Badge>
                          </div>
                        )}
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
                            {new Date(promoCode.expiresAt).toLocaleDateString()}
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
                            onToggleStatus(promoCode.id, checked)
                          }
                          onClick={(e) => e.stopPropagation()}
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
  );
}
