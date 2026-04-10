"use client";

import { Info, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SectionIntroProps {
  /** Section title, e.g., "About Part 8: Exposure Information" */
  title: string;
  /** Brief description of what this section covers */
  description: string;
  /** Estimated minutes to complete */
  estimatedMinutes?: number;
  /** Items the user should have handy */
  whatYouNeed?: string[];
  /** Why the DOJ needs this information */
  whyItMatters?: string;
}

/**
 * Consistent intro card for form sections.
 *
 * Sets expectations: what's coming, how long it takes, what to have ready,
 * and why it matters for the DOJ submission.
 */
export function SectionIntro({
  title,
  description,
  estimatedMinutes,
  whatYouNeed,
  whyItMatters,
}: SectionIntroProps) {
  return (
    <Card className="mb-6 rounded-2xl border-sage-200 bg-gradient-to-br from-sage-50 to-white">
      <CardContent className="pt-5">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-500" />
          <div className="space-y-2">
            <div>
              <p className="font-semibold text-sage-900">{title}</p>
              <p className="text-sm text-sage-700">{description}</p>
            </div>

            {estimatedMinutes && (
              <div className="flex items-center gap-1.5 text-xs text-sage-500">
                <Clock className="h-3.5 w-3.5" />
                <span>About {estimatedMinutes} minutes</span>
              </div>
            )}

            {whatYouNeed && whatYouNeed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-sage-700">Have ready:</p>
                <ul className="mt-1 space-y-0.5">
                  {whatYouNeed.map((item, i) => (
                    <li key={i} className="text-xs text-sage-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {whyItMatters && (
              <p className="text-xs italic text-sage-500">
                Why: {whyItMatters}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
