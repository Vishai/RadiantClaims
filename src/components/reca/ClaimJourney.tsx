"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClaimStage =
  | "forms"
  | "documents"
  | "review"
  | "file"
  | "confirmation";

interface ClaimJourneyProps {
  currentStage: ClaimStage;
}

const STAGES: { id: ClaimStage; label: string }[] = [
  { id: "forms", label: "Forms" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
  { id: "file", label: "File with DOJ" },
  { id: "confirmation", label: "Done" },
];

/**
 * Post-form journey stepper — shows users where they are in the overall
 * claim process after form completion.
 *
 * Displays: Forms ✓ → Documents → Review → File with DOJ → Done
 */
export function ClaimJourney({ currentStage }: ClaimJourneyProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="mb-8 rounded-2xl border border-cream-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={stage.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                    isCompleted &&
                      "border-terracotta-500 bg-terracotta-500 text-white",
                    isCurrent &&
                      "border-terracotta-500 bg-white text-terracotta-600 ring-4 ring-terracotta-100",
                    isUpcoming && "border-cream-300 bg-white text-sage-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-1.5 text-center text-[10px] font-medium sm:text-xs",
                    isCurrent && "text-terracotta-700",
                    isCompleted && "text-sage-700",
                    isUpcoming && "text-sage-400"
                  )}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector */}
              {index < STAGES.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 sm:mx-2",
                    isCompleted ? "bg-terracotta-500" : "bg-cream-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
