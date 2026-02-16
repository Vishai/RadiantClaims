"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RATES = [
  { label: "Conservative", value: 0.04, description: "4% annually" },
  { label: "Moderate", value: 0.06, description: "6% annually" },
  { label: "Growth", value: 0.08, description: "8% annually" },
] as const;

const YEAR_MARKS = [5, 10, 15, 20, 25, 30];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CompoundInterestCalculatorProps {
  onCalculatorViewed?: () => void;
}

export function CompoundInterestCalculator({
  onCalculatorViewed,
}: CompoundInterestCalculatorProps) {
  const [principal, setPrincipal] = useState(100000);
  const [rateIndex, setRateIndex] = useState(1); // default: Moderate
  const [years, setYears] = useState(20);
  const [hasTracked, setHasTracked] = useState(false);

  const rate = RATES[rateIndex]?.value ?? 0.06;

  const futureValue = useMemo(() => {
    return principal * Math.pow(1 + rate, years);
  }, [principal, rate, years]);

  const growth = futureValue - principal;
  const growthPercent = Math.round((futureValue / principal) * 100);

  // Track engagement on first interaction
  const handleInteraction = () => {
    if (!hasTracked && onCalculatorViewed) {
      setHasTracked(true);
      onCalculatorViewed();
    }
  };

  return (
    <Card className="rounded-2xl border border-sage-200 bg-white p-6 shadow-sm">
      <div className="space-y-6">
        {/* Starting Amount */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Starting Amount
          </label>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(principal)}
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={principal}
            onChange={(e) => {
              setPrincipal(Number(e.target.value));
              handleInteraction();
            }}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-terracotta-500"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>$10K</span>
            <span>$200K</span>
          </div>
        </div>

        {/* Return Rate */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Estimated Annual Return
          </label>
          <Tabs
            value={String(rateIndex)}
            onValueChange={(v) => {
              setRateIndex(Number(v));
              handleInteraction();
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              {RATES.map((r, i) => (
                <TabsTrigger key={r.label} value={String(i)}>
                  <span className="text-xs sm:text-sm">{r.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="mt-1 text-center text-xs text-slate-500">
            {RATES[rateIndex]?.description}
          </p>
        </div>

        {/* Time Horizon */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Time Horizon:{" "}
            <span className="font-bold text-slate-900">{years} years</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={1}
            value={years}
            onChange={(e) => {
              setYears(Number(e.target.value));
              handleInteraction();
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-terracotta-500"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            {YEAR_MARKS.map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Potential Future Value
          </p>
          <p className="mt-1 text-4xl font-bold text-emerald-900">
            {formatCurrency(futureValue)}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            {formatCurrency(growth)} in growth ({growthPercent}% of original)
          </p>
        </div>

        {/* Visual Comparison */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-16 text-right text-xs text-slate-500">
              Today
            </span>
            <div
              className="h-6 rounded-md bg-slate-300"
              style={{ width: "30%" }}
            />
            <span className="text-sm font-medium text-slate-700">
              {formatCurrency(principal)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-right text-xs text-slate-500">
              {years}yr
            </span>
            <div
              className="h-6 rounded-md bg-emerald-500 transition-all duration-300"
              style={{
                width: `${Math.min(90, (growthPercent / 400) * 90)}%`,
              }}
            />
            <span className="text-sm font-bold text-emerald-800">
              {formatCurrency(futureValue)}
            </span>
          </div>
        </div>

        {/* Plain English */}
        <p className="text-center text-sm text-slate-600">
          If you invested {formatCurrency(principal)} at{" "}
          {Math.round(rate * 100)}% annual return for {years} years, it could
          grow to approximately{" "}
          <strong className="text-slate-900">
            {formatCurrency(futureValue)}
          </strong>
          .
        </p>

        {/* Disclaimer */}
        <p className="text-center text-xs italic text-slate-400">
          This is a simplified illustration for educational purposes only.
          Actual returns will vary. This is not financial advice.
        </p>
      </div>
    </Card>
  );
}
