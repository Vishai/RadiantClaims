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
    { stage: 5, name: "Review", sections: ["final_review"] },
  ];

  const currentStage = getSectionStage(currentSection);

  return (
    <div className="w-full bg-white border-b border-cream-200 sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-sage-700">
              Progress: {completionPercentage}%
            </span>
            <span className="text-sm text-sage-600">
              {getSectionDisplayName(currentSection)}
            </span>
          </div>
          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
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
              <div key={stage.stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-terracotta-500 border-terracotta-500 text-white"
                          : ""
                      }
                      ${
                        isCurrent
                          ? "bg-white border-terracotta-500 text-terracotta-600 ring-4 ring-terracotta-100"
                          : ""
                      }
                      ${
                        isUpcoming
                          ? "bg-white border-cream-300 text-sage-400"
                          : ""
                      }
                    `}
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
                    className={`
                      mt-2 text-xs font-medium text-center
                      ${isCurrent ? "text-terracotta-700" : ""}
                      ${isCompleted ? "text-sage-700" : ""}
                      ${isUpcoming ? "text-sage-400" : ""}
                    `}
                  >
                    {stage.name}
                  </span>
                </div>

                {/* Connector Line */}
                {index < stages.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-2 transition-all duration-300
                      ${isCompleted ? "bg-terracotta-500" : "bg-cream-200"}
                    `}
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
