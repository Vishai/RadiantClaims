"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part10Diseases, CompensableDisease } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Activity, Info } from "lucide-react";

// Validation schema - at least 1 disease must be selected
const part10Schema = z.object({
  diseases: z
    .array(z.string())
    .min(1, "You must select at least one compensable disease"),
});

type Part10FormData = z.infer<typeof part10Schema>;

interface Part10FormProps {
  initialData?: Partial<Part10Diseases>;
  onSubmit: (data: Part10Diseases) => void;
}

// Disease options organized by category
const diseaseCategories = [
  {
    category: "Blood and Lymphatic Cancers",
    diseases: [
      { id: "leukemia", label: "Leukemia (other than chronic lymphocytic leukemia)" },
      { id: "multiple_myeloma", label: "Multiple Myeloma" },
      { id: "lymphomas", label: "Lymphomas (other than Hodgkin's disease)" },
    ],
  },
  {
    category: "Endocrine and Breast Cancers",
    diseases: [
      { id: "thyroid", label: "Primary cancer of the thyroid" },
      { id: "breast", label: "Primary cancer of the male or female breast" },
    ],
  },
  {
    category: "Digestive System Cancers",
    diseases: [
      { id: "esophagus", label: "Primary cancer of the esophagus" },
      { id: "stomach", label: "Primary cancer of the stomach" },
      { id: "pharynx", label: "Primary cancer of the pharynx" },
      { id: "small_intestine", label: "Primary cancer of the small intestine" },
      { id: "pancreas", label: "Primary cancer of the pancreas" },
      { id: "bile_ducts", label: "Primary cancer of the bile ducts" },
      { id: "gall_bladder", label: "Primary cancer of the gall bladder" },
      { id: "salivary_gland", label: "Primary cancer of the salivary gland" },
      { id: "colon", label: "Primary cancer of the colon" },
      { id: "liver", label: "Primary cancer of the liver (except if cirrhosis or hepatitis B is indicated)" },
    ],
  },
  {
    category: "Other Organ Cancers",
    diseases: [
      { id: "urinary_bladder", label: "Primary cancer of the urinary bladder" },
      { id: "brain", label: "Primary cancer of the brain" },
      { id: "ovary", label: "Primary cancer of the ovary" },
      { id: "lung", label: "Primary cancer of the lung" },
    ],
  },
];

export default function Part10Form({ initialData, onSubmit }: Part10FormProps) {
  const form = useForm<Part10FormData>({
    resolver: zodResolver(part10Schema),
    defaultValues: {
      diseases: initialData?.diseases || [],
    },
  });

  const selectedDiseases = form.watch("diseases");
  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if valid
      if (values.diseases && values.diseases.length > 0) {
        onSubmit({ diseases: values.diseases as CompensableDisease[] });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  const handleDiseaseToggle = (diseaseId: string) => {
    const currentDiseases = form.getValues("diseases") || [];
    const newDiseases = currentDiseases.includes(diseaseId)
      ? currentDiseases.filter((d) => d !== diseaseId)
      : [...currentDiseases, diseaseId];

    form.setValue("diseases", newDiseases, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Activity className="h-5 w-5 text-terracotta-500" />
            Part 10: Compensable Diseases
          </CardTitle>
          <CardDescription>
            Select the disease(s) the claimant developed. Only the diseases listed below are
            eligible for RECA compensation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guidance */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">
                  Important Guidance
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Select all that apply:</strong> If you are unsure which specific cancer
                  type the claimant had, you may check multiple boxes. The RECA Program will review
                  your medical documentation to confirm the diagnosis.
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only primary cancers are eligible. Secondary (metastatic)
                  cancers that have spread from another location are not compensable.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {formErrors.diseases && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">
                    Selection Required
                  </p>
                  <p className="text-sm text-red-800">
                    {formErrors.diseases.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disease Selection by Category */}
          <div className="space-y-6">
            <Label className="text-base font-semibold text-sage-900">
              Check all diseases that apply ({selectedDiseases?.length || 0} selected)
            </Label>

            {diseaseCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-3">
                <h3 className="text-sm font-semibold text-sage-800 uppercase tracking-wide border-b border-sage-200 pb-2">
                  {category.category}
                </h3>
                <div className="grid gap-3">
                  {category.diseases.map((disease) => (
                    <div
                      key={disease.id}
                      className={`flex items-start gap-3 rounded-md border p-4 transition-colors ${
                        selectedDiseases?.includes(disease.id)
                          ? "bg-terracotta-50 border-terracotta-300"
                          : "bg-white border-sage-200 hover:border-sage-300"
                      }`}
                    >
                      <Checkbox
                        id={disease.id}
                        checked={selectedDiseases?.includes(disease.id)}
                        onCheckedChange={() => handleDiseaseToggle(disease.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={disease.id}
                          className="text-sm font-medium leading-snug cursor-pointer"
                        >
                          {disease.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Total Count Display */}
          <div className="rounded-lg bg-sage-50 border border-sage-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-sage-900">
                  Total Diseases Selected
                </p>
                <p className="text-xs text-sage-600 mt-1">
                  You can select multiple diseases if applicable
                </p>
              </div>
              <div className="text-3xl font-bold text-terracotta-600">
                {selectedDiseases?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-2">
                Eligibility Requirements
              </p>
              <div className="text-sm text-amber-800 space-y-2">
                <p>
                  <strong>Chronic Lymphocytic Leukemia:</strong> This type of leukemia is NOT
                  compensable under RECA. If the claimant had chronic lymphocytic leukemia, they
                  are not eligible for compensation.
                </p>
                <p>
                  <strong>Hodgkin's Disease:</strong> This type of lymphoma is NOT compensable
                  under RECA. Only non-Hodgkin's lymphomas are eligible.
                </p>
                <p>
                  <strong>Liver Cancer with Cirrhosis or Hepatitis B:</strong> Primary liver
                  cancer is NOT compensable if the claimant also had cirrhosis or hepatitis B.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Step:</strong> After selecting the disease(s), you will need to
                provide medical documentation proving the diagnosis in Part 11. Medical records
                showing the diagnosis are required for all compensable diseases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
