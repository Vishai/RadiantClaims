"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part2ClaimantInfo, RECAFormData } from "@/lib/reca/types";
import { FormField } from "@/components/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";
import { useAutofill } from "@/lib/reca/useAutofill";
import { AutofillInfoBanner } from "@/components/reca/AutofillBadge";
import { FamilyMemberSelector } from "@/components/reca/FamilyMemberSelector";
import { DocumentRequirementsInline } from "@/components/reca/DocumentRequirementsInline";

const part2Schema = z.object({
  firstName: z.string().min(1, "First name is required").max(12),
  middleName: z.string().max(12).optional(),
  lastName: z.string().min(1, "Last name is required").max(20),
  formerNames: z.string().max(20).optional(),
  ssn: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  dob: z.string().min(1, "Date of birth is required"),
  dod: z
    .string()
    .min(
      1,
      "Date of death is required - only survivors can file on behalf of deceased individuals"
    ),
});

type Part2FormData = z.infer<typeof part2Schema>;

interface Part2FormProps {
  initialData?: Partial<Part2ClaimantInfo>;
  onSubmit: (data: Part2ClaimantInfo) => void;
  currentFormData?: Partial<RECAFormData>; // Add current form data for autofill
}

export function Part2Form({
  initialData,
  onSubmit,
  currentFormData = {},
}: Part2FormProps) {
  const [showFamilySelector, setShowFamilySelector] = useState(!initialData);
  const [selectedFromCache, setSelectedFromCache] = useState(false);

  // Get autofill defaults
  const autofill = useAutofill({
    targetPart: "part_2",
    currentFormData,
  });

  // Merge autofill defaults with initial data (initial data takes precedence)
  const defaultValues = autofill.mergeDefaults({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    formerNames: initialData?.formerNames || "",
    ssn: initialData?.ssn || "",
    dob: initialData?.dob || "",
    dod: initialData?.dod || "",
  });

  const form = useForm<Part2FormData>({
    resolver: zodResolver(part2Schema),
    defaultValues,
  });

  const handleSubmit = (data: Part2FormData) => {
    onSubmit(data as Part2ClaimantInfo);
  };

  // Handle family member selection
  const handleFamilyMemberSelect = (
    claimantData: Partial<Part2ClaimantInfo>,
    memberId: string
  ) => {
    // Pre-fill form with selected family member data
    form.reset({
      ...defaultValues,
      ...claimantData,
    } as Part2FormData);
    setSelectedFromCache(true);
    setShowFamilySelector(false);
  };

  const handleSkipFamilySelector = () => {
    setShowFamilySelector(false);
  };

  // Get unique source labels for autofilled fields
  const autofilledSources = Array.from(
    new Set(
      autofill.autofilledFields
        .map((field) => autofill.getSource(field)?.label)
        .filter((label): label is string => Boolean(label))
    )
  );

  // Add "Family Member Cache" to sources if data came from cache
  const allSources = selectedFromCache
    ? ["Family Member Cache", ...autofilledSources]
    : autofilledSources;

  // Show family member selector first (if no initial data and selector not dismissed)
  if (
    showFamilySelector &&
    !initialData &&
    currentFormData.part_3?.relationship
  ) {
    return (
      <div className="space-y-6">
        <FamilyMemberSelector
          relationship={currentFormData.part_3.relationship}
          onSelect={handleFamilyMemberSelect}
          onSkip={handleSkipFamilySelector}
        />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Autofill Info Banner */}
      {(autofill.autofilledFields.length > 0 || selectedFromCache) && (
        <AutofillInfoBanner
          autofilledCount={
            selectedFromCache
              ? autofill.autofilledFields.length + 1
              : autofill.autofilledFields.length
          }
          sources={allSources}
        />
      )}

      {/* Document Requirements Inline */}
      <DocumentRequirementsInline
        formData={currentFormData}
        relatedFormSection="part_2"
        variant="card"
        title="Documents You'll Need for the Claimant"
        description="Based on the deceased individual's information, you'll need to upload these documents"
      />

      {/* Info Card */}
      <Card className="border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
            <div className="text-sm text-terracotta-900">
              <p className="mb-1 font-semibold">
                About Part 2: Deceased Individual's Information
              </p>
              <p>
                This section collects information about{" "}
                <strong>THE DECEASED PERSON WHO BECAME ILL</strong> with a
                compensable disease. As a survivor, you are filing on behalf of
                a family member who was exposed to radiation, developed cancer,
                and has since passed away.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claimant Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Deceased Individual's Information
          </CardTitle>
          <CardDescription className="text-sage-600">
            Information about the deceased person who became ill from radiation
            exposure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              form={form}
              name="firstName"
              label="First Name"
              required
              maxLength={12}
            />
            <FormField
              form={form}
              name="middleName"
              label="Middle Name"
              maxLength={12}
            />
            <FormField
              form={form}
              name="lastName"
              label="Last Name"
              required
              maxLength={20}
            />
          </div>

          <FormField
            form={form}
            name="formerNames"
            label="Former Names or Maiden Name"
            placeholder="If applicable"
            maxLength={20}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              form={form}
              name="ssn"
              label="Social Security Number"
              type="ssn"
              required
              placeholder="XXX-XX-XXXX"
              helperText="Format: XXX-XX-XXXX"
            />
            <FormField
              form={form}
              name="dob"
              label="Date of Birth"
              type="date"
              required
            />
          </div>

          <FormField
            form={form}
            name="dod"
            label="Date of Death"
            type="date"
            required
            helperText="Required - Only survivors of deceased individuals can file claims on their behalf"
          />
        </CardContent>
      </Card>
    </form>
  );
}
