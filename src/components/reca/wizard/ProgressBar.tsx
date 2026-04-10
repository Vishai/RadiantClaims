"use client";

import { Check } from "lucide-react";
import { RECAWorkflowSection } from "@/lib/reca/types";
import { getSectionDisplayName, getSectionStage } from "@/lib/reca/workflow";

/** Estimated minutes per section (used for "About X min remaining") */
const SECTION_MINUTES: Partial<Record<RECAWorkflowSection, number>> = {
  part_1: 3,
  part_2: 2,
  part_3: 1,
  part_4: 3,
  part_5: 4,
  part_6: 5,
  part_7: 4,
  part_8: 3,
  part_9: 3,
  part_10: 2,
  part_11: 3,
  part_12: 2,
  part_13: 2,
  part_14: 1,
  part_15: 2,
  part_16: 2,
};

interface ProgressBarProps {
  currentSection: RECAWorkflowSection;
  completionPercentage: number;
  /** 1-based index of current section within the applicable section list */
  currentSectionIndex?: number;
  /** Total number of applicable sections for this user */
  totalApplicableSections?: number;
}

export function ProgressBar({
  currentSection,
  completionPercentage,
  currentSectionIndex,
  totalApplicableSections,
}: ProgressBarProps) {
  const stages = [
    { stage: 1, name: "Eligibility", sections: ["eligibility"] },
    {
      stage: 2,
      name: "Form Details",
      sections: [
        "part_1",
        "part_2",
        "part_3",
        "part_4",
        "part_5",
        "part_6",
        "part_7",
        "part_8",
        "part_9",
        "part_10",
        "part_11",
        "part_12",
        "part_13",
        "part_14",
        "part_15",
        "part_16",
      ],
    },
    { stage: 3, name: "Supporting Forms", sections: ["supporting_forms"] },
    { stage: 4, name: "Documents", sections: ["document_checklist"] },
    { stage: 5, name: "Review", sections: ["review", "final_review"] },
  ];

  const currentStage = getSectionStage(currentSection);

  return (
    <div className="sticky top-0 z-10 w-full border-b border-cream-200 bg-white">
      <div className="container mx-auto px-6 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-sage-700">
              Progress: {completionPercentage}%
            </span>
            <span className="text-sm text-sage-600">
              {getSectionDisplayName(currentSection)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full bg-gradient-to-r from-terracotta-400 to-terracotta-600 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {/* Section context: "Section 5 of 10 · About 15 min remaining" */}
          {currentSectionIndex != null && totalApplicableSections != null && (
            <p className="mt-1 text-xs text-sage-500">
              Section {currentSectionIndex} of {totalApplicableSections}
              {(() => {
                // Calculate remaining minutes from current section onward
                const allSections = stages[1]?.sections ?? [];
                const currentIdx = allSections.indexOf(currentSection);
                if (currentIdx === -1) return null;
                const remaining = allSections
                  .slice(currentIdx)
                  .reduce(
                    (sum, s) =>
                      sum + (SECTION_MINUTES[s as RECAWorkflowSection] ?? 2),
                    0
                  );
                // Only show time estimate in the first 75% of the form
                if (
                  currentSectionIndex <=
                  Math.ceil(totalApplicableSections * 0.75)
                ) {
                  return <span> · About {remaining} min remaining</span>;
                }
                return null;
              })()}
            </p>
          )}
        </div>

        {/* Stage Indicators */}
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const isCompleted = stage.stage < currentStage;
            const isCurrent = stage.stage === currentStage;
            const isUpcoming = stage.stage > currentStage;

            return (
              <div key={stage.stage} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? "border-terracotta-500 bg-terracotta-500 text-white"
                        : ""
                    } ${
                      isCurrent
                        ? "border-terracotta-500 bg-white text-terracotta-600 ring-4 ring-terracotta-100"
                        : ""
                    } ${
                      isUpcoming
                        ? "border-cream-300 bg-white text-sage-400"
                        : ""
                    } `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {stage.stage}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`mt-2 text-center text-xs font-medium ${isCurrent ? "text-terracotta-700" : ""} ${isCompleted ? "text-sage-700" : ""} ${isUpcoming ? "text-sage-400" : ""} `}
                  >
                    {stage.name}
                  </span>
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-all duration-300 ${isCompleted ? "bg-terracotta-500" : "bg-cream-200"} `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
