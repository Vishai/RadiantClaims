"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface FinancialPlanningCardProps {
  sessionId: string;
  visible?: boolean;
}

export function FinancialPlanningCard({
  sessionId,
  visible = false,
}: FinancialPlanningCardProps) {
  const router = useRouter();

  if (!visible) return null;

  return (
    <Card className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Plan Your Future
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">New</Badge>
              <span className="text-sm font-semibold text-emerald-900">
                Make Your Compensation Work For You
              </span>
            </div>
          </div>
          <div className="rounded-full bg-emerald-100 p-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <p className="text-sm text-emerald-800">
          See what your $100K could become with a simple plan. Interactive
          calculator, practical tips, and expert resources — all in one place.
        </p>

        <Button
          className="gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700"
          onClick={() => router.push(`/reca/what-comes-next/${sessionId}`)}
        >
          <TrendingUp className="h-4 w-4" />
          Open Calculator
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
