"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

export interface MissingField {
  fieldName: string;
  fieldLabel: string;
  importance: "required" | "recommended" | "optional";
  section?: string;
}

export interface IncompleteFieldsProps {
  missingFields: MissingField[];
  sectionName: string;
  onAcknowledge: (acknowledged: boolean) => void;
  onContinue: () => void;
  canBypass?: boolean; // For truly optional sections
}

export function IncompleteFieldsAcknowledgment({
  missingFields,
  sectionName,
  onAcknowledge,
  onContinue,
  canBypass = false,
}: IncompleteFieldsProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const requiredFields = missingFields.filter(
    (f) => f.importance === "required"
  );
  const recommendedFields = missingFields.filter(
    (f) => f.importance === "recommended"
  );

  useEffect(() => {
    onAcknowledge(acknowledged);
  }, [acknowledged, onAcknowledge]);

  // If no required or recommended fields are missing, allow direct continuation
  if (requiredFields.length === 0 && recommendedFields.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="flex-1">
              <p className="mb-1 font-semibold text-green-900">
                Section Complete
              </p>
              <p className="text-sm text-green-700">
                You've provided all the essential information for this section.
              </p>
            </div>
            <Button onClick={onContinue} className="gap-2">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Missing Information Alert */}
      <Card
        className={`border-2 ${
          requiredFields.length > 0
            ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
            : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle
              className={`h-5 w-5 ${
                requiredFields.length > 0 ? "text-amber-600" : "text-blue-600"
              }`}
            />
            Information Needed in {sectionName}
          </CardTitle>
          <CardDescription>
            Some information is missing. You can continue, but you'll need to
            return to complete this section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary of Missing Items */}
          <div className="space-y-3">
            {requiredFields.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-amber-900">
                      Required Information ({requiredFields.length}{" "}
                      {requiredFields.length === 1 ? "item" : "items"})
                    </p>
                    <p className="text-xs text-amber-800">
                      This information is required for DOJ submission.
                    </p>
                    {showDetails && (
                      <ul className="mt-2 space-y-1 text-xs text-amber-800">
                        {requiredFields.map((field, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-amber-600">•</span>
                            <span>{field.fieldLabel}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {recommendedFields.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-semibold text-blue-900">
                      Recommended Information ({recommendedFields.length}{" "}
                      {recommendedFields.length === 1 ? "item" : "items"})
                    </p>
                    <p className="text-xs text-blue-800">
                      This information helps process your claim faster.
                    </p>
                    {showDetails && (
                      <ul className="mt-2 space-y-1 text-xs text-blue-800">
                        {recommendedFields.map((field, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-blue-600">•</span>
                            <span>{field.fieldLabel}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show/Hide Details Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm"
          >
            {showDetails ? "Hide" : "Show"} Details
          </Button>

          {/* Acknowledgment Checkbox */}
          <div className="rounded-lg border-2 border-sage-300 bg-sage-50 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="acknowledge-incomplete"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(!!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="acknowledge-incomplete"
                  className="cursor-pointer text-sm font-medium text-sage-900"
                >
                  I understand that I need to return to complete this section
                </Label>
                <p className="mt-1 text-xs text-sage-700">
                  The missing information will be added to your review
                  checklist. You won't be able to submit to DOJ until all
                  required information is complete.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Scroll to first missing field or stay on form
                const firstMissing = document.querySelector(
                  '[data-incomplete="true"]'
                );
                if (firstMissing) {
                  firstMissing.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
            >
              Complete Now
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Add to review/todo list but stay on page
                  setAcknowledged(true);
                }}
                disabled={acknowledged}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Add to Review List
              </Button>

              <Button
                onClick={onContinue}
                disabled={!acknowledged && !canBypass}
                className="gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      {acknowledged && (
        <Card className="border border-sage-200">
          <CardContent className="pt-4">
            <p className="text-sm text-sage-700">
              <span className="font-semibold">What happens next:</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-sage-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-500" />
                <span>
                  This section is marked as "Incomplete" in your progress
                  tracker
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-500" />
                <span>Missing items are added to your review checklist</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-500" />
                <span>
                  You can return anytime from the review page or navigation menu
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-500" />
                <span>We'll remind you before final submission</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Companion hook to track field completion
export function useFieldCompletion(
  formData: any,
  fieldDefinitions: Array<{
    name: string;
    label: string;
    importance: "required" | "recommended" | "optional";
    validator?: (value: any) => boolean;
  }>
) {
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    const missing: MissingField[] = [];
    let completed = 0;

    fieldDefinitions.forEach((field) => {
      const value = formData[field.name];
      const isValid = field.validator ? field.validator(value) : !!value;

      if (!isValid) {
        missing.push({
          fieldName: field.name,
          fieldLabel: field.label,
          importance: field.importance,
        });
      } else {
        completed++;
      }
    });

    setMissingFields(missing);
    setCompletionPercentage(
      fieldDefinitions.length > 0
        ? Math.round((completed / fieldDefinitions.length) * 100)
        : 100
    );
  }, [formData, fieldDefinitions]);

  return {
    missingFields,
    completionPercentage,
    hasRequiredFields: missingFields.some((f) => f.importance === "required"),
    isComplete:
      missingFields.filter((f) => f.importance === "required").length === 0,
  };
}

// Import necessary for Label
import { Label } from "@/components/ui/label";
