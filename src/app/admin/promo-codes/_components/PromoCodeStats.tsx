import { Card, CardContent } from "@/components/ui/card";
import { PromoCode } from "./types";

interface PromoCodeStatsProps {
  promoCodes: PromoCode[];
}

export function PromoCodeStats({ promoCodes }: PromoCodeStatsProps) {
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
    <div className="mb-6 grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{promoCodes.length}</div>
          <p className="text-sm text-gray-600">Total Codes</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{totalActive}</div>
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
  );
}
