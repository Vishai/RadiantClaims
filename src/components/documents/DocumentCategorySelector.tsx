"use client";

import { useState } from "react";
import {
  Check,
  FileText,
  Home,
  Stethoscope,
  Receipt,
  GraduationCap,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type FileCategory =
  | "IDENTITY"
  | "PROOF_OF_RESIDENCE"
  | "PATHOLOGY_REPORT"
  | "MEDICAL_RECORDS"
  | "DISCHARGE_SUMMARY"
  | "TUMOR_REGISTRY"
  | "TREATMENT_RECORDS"
  | "UTILITY_BILL"
  | "MORTGAGE_STATEMENT"
  | "TAX_RETURN"
  | "SCHOOL_RECORDS"
  | "EMPLOYMENT_RECORDS"
  | "OTHER";

interface CategoryOption {
  value: FileCategory;
  label: string;
  description: string;
  icon: any;
  group: "identity" | "medical" | "residence" | "other";
}

const categoryOptions: CategoryOption[] = [
  // Identity Documents
  {
    value: "IDENTITY",
    label: "Identity Document",
    description:
      "Birth certificate, death certificate, marriage certificate, etc.",
    icon: FileText,
    group: "identity",
  },

  // Medical Documents
  {
    value: "PATHOLOGY_REPORT",
    label: "Pathology Report",
    description: "Lab results showing cancer diagnosis",
    icon: Stethoscope,
    group: "medical",
  },
  {
    value: "MEDICAL_RECORDS",
    label: "Medical Records",
    description: "Doctor's notes, hospital records, treatment history",
    icon: Stethoscope,
    group: "medical",
  },
  {
    value: "DISCHARGE_SUMMARY",
    label: "Discharge Summary",
    description: "Hospital discharge paperwork",
    icon: Stethoscope,
    group: "medical",
  },
  {
    value: "TUMOR_REGISTRY",
    label: "Tumor Registry",
    description: "State cancer registry records",
    icon: Stethoscope,
    group: "medical",
  },
  {
    value: "TREATMENT_RECORDS",
    label: "Treatment Records",
    description: "Chemotherapy, radiation, or surgery records",
    icon: Stethoscope,
    group: "medical",
  },

  // Proof of Residence
  {
    value: "PROOF_OF_RESIDENCE",
    label: "Proof of Residence",
    description: "General proof of residence document",
    icon: Home,
    group: "residence",
  },
  {
    value: "UTILITY_BILL",
    label: "Utility Bill",
    description: "Electric, gas, water, or phone bill",
    icon: Receipt,
    group: "residence",
  },
  {
    value: "MORTGAGE_STATEMENT",
    label: "Mortgage/Property Record",
    description: "Property deed, mortgage statement, or tax records",
    icon: Home,
    group: "residence",
  },
  {
    value: "TAX_RETURN",
    label: "Tax Return",
    description: "Federal or state tax return showing address",
    icon: Receipt,
    group: "residence",
  },
  {
    value: "SCHOOL_RECORDS",
    label: "School Records",
    description: "Transcripts, enrollment records, report cards",
    icon: GraduationCap,
    group: "residence",
  },
  {
    value: "EMPLOYMENT_RECORDS",
    label: "Employment Records",
    description: "Pay stubs, W-2 forms, employment verification",
    icon: Briefcase,
    group: "residence",
  },

  // Other
  {
    value: "OTHER",
    label: "Other",
    description: "Document type not listed above",
    icon: HelpCircle,
    group: "other",
  },
];

interface DocumentCategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detectedCategory?: FileCategory;
  currentCategory?: FileCategory;
  onConfirm: (category: FileCategory) => void;
  fileName?: string;
}

export function DocumentCategorySelector({
  open,
  onOpenChange,
  detectedCategory,
  currentCategory,
  onConfirm,
  fileName,
}: DocumentCategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>(
    currentCategory || detectedCategory || "OTHER"
  );

  const handleConfirm = () => {
    onConfirm(selectedCategory);
    onOpenChange(false);
  };

  const groupedOptions = categoryOptions.reduce(
    (acc, option) => {
      if (!acc[option.group]) {
        acc[option.group] = [];
      }
      acc[option.group].push(option);
      return acc;
    },
    {} as Record<string, CategoryOption[]>
  );

  const groupLabels: Record<string, string> = {
    identity: "Identity Documents",
    medical: "Medical Records",
    residence: "Proof of Residence",
    other: "Other",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Document Type</DialogTitle>
          <DialogDescription>
            {fileName && (
              <span className="mt-1 block text-sm font-medium text-sage-900">
                {fileName}
              </span>
            )}
            <span className="mt-2 block">
              Choose the category that best describes this document. We'll help
              you identify which documents typically require original copies.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {detectedCategory && (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium">Suggested Category</p>
              <p className="mt-1">
                We detected this as{" "}
                <strong>
                  {categoryOptions.find((c) => c.value === detectedCategory)
                    ?.label || "Unknown"}
                </strong>
                . You can change it if needed.
              </p>
            </div>
          )}

          {Object.entries(groupedOptions).map(([groupKey, options]) => (
            <div key={groupKey}>
              <h4 className="mb-3 text-sm font-semibold text-sage-900">
                {groupLabels[groupKey]}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedCategory === option.value;
                  const isSuggested = detectedCategory === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedCategory(option.value)}
                      className={cn(
                        "relative flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors",
                        isSelected
                          ? "border-terracotta-500 bg-terracotta-50"
                          : isSuggested
                            ? "border-blue-300 bg-blue-50"
                            : "border-cream-200 bg-white hover:border-sage-300 hover:bg-cream-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-terracotta-100"
                            : isSuggested
                              ? "bg-blue-100"
                              : "bg-sage-100"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isSelected
                              ? "text-terracotta-600"
                              : isSuggested
                                ? "text-blue-600"
                                : "text-sage-600"
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-terracotta-900"
                                : "text-sage-900"
                            )}
                          >
                            {option.label}
                          </p>
                          {isSuggested && !isSelected && (
                            <span className="text-xs text-blue-600">
                              (suggested)
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-sage-600">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
          >
            Confirm Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
