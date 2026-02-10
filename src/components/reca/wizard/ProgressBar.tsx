"use client";

import { Check } from "lucide-react";
import { RECAWorkflowSection } from "@/lib/reca/types";
import { getSectionDisplayName, getSectionStage } from "@/lib/reca/workflow";

interface ProgressBarProps {
  currentSection: RECAWorkflowSection;
  completionPercentage: number;
}

export function ProgressBar({
  currentSection,
  completionPercentage,
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
