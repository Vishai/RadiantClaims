"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part2ClaimantInfo, Part1FilerInfo } from "@/lib/reca/types";
import { FormField } from "@/components/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const formerNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["MAIDEN", "MARRIED", "DIVORCED", "LEGAL_CHANGE", "OTHER"], {
    required_error: "Please select name change type",
  }),
  year: z
    .string()
    .regex(/^\d{4}$/, "Year must be 4 digits (YYYY)")
    .optional()
    .or(z.literal("")),
});

const part2Schema = z.object({
  firstName: z.string().max(12).optional(),
  middleName: z.string().max(12).optional(),
  lastName: z.string().max(20).optional(),
  formerNames: z.array(formerNameSchema).optional(),
  ssn: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX")
    .optional()
    .or(z.literal("")),
  dob: z.string().optional(),
  dod: z.string().optional(),
});

type Part2FormData = z.infer<typeof part2Schema>;

interface Part2FormProps {
  initialData?: Partial<Part2ClaimantInfo>;
  onSubmit: (data: Part2ClaimantInfo) => void;
  part1Data?: Partial<Part1FilerInfo>; // Filer information for name matching validation
}

export function Part2Form({
  initialData,
  onSubmit,
  part1Data,
}: Part2FormProps) {
  const [nameMatchWarning, setNameMatchWarning] = useState<string | null>(null);
  const [dateConsistencyErrors, setDateConsistencyErrors] = useState<string[]>(
    []
  );

  const form = useForm<Part2FormData>({
    resolver: zodResolver(part2Schema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      formerNames: initialData?.formerNames || [],
      ssn: initialData?.ssn || "",
      dob: initialData?.dob || "",
      dod: initialData?.dod || "",
    },
  });

  // Watch the deceased's last name to validate against filer's names
  const deceasedLastName = form.watch("lastName");
  const dob = form.watch("dob");
  const dod = form.watch("dod");

  // Validate date consistency
  useEffect(() => {
    const errors: string[] = [];

    if (dob && dod) {
      const birthDate = new Date(dob);
      const deathDate = new Date(dod);

      // Check if DOD is before DOB
      if (deathDate < birthDate) {
        errors.push("Date of death cannot be before date of birth.");
      }

      // Check if DOD is in the future
      const today = new Date();
      if (deathDate > today) {
        errors.push("Date of death cannot be in the future.");
      }

      // Check latency period - must have lived long enough after exposure to develop cancer
      // RECA downwinder program covers exposure from 1951-1962 and 1964-1980s
      // Minimum latency for most cancers is typically 2 years, but can be much longer
      const exposureEndYear = 1992; // Latest possible exposure year
      const exposureEnd = new Date(`${exposureEndYear}-12-31`);

      // If they died before exposure period ended, they couldn't have developed cancer from it
      if (deathDate < new Date("1951-01-01")) {
        errors.push(
          "Date of death is before the nuclear testing period (1951-1992). Please verify this date."
        );
      }

      // Calculate time between end of exposure and death for latency check
      const yearsBetween = deathDate.getFullYear() - exposureEnd.getFullYear();
      if (yearsBetween < 0 && deathDate < exposureEnd) {
        // Died during exposure period - possible but requires latency validation
        const deathYear = deathDate.getFullYear();
        if (deathYear < 1953) {
          errors.push(
            "Death occurred very early in the exposure period. Please verify this date is correct, as there typically needs to be a latency period between exposure and cancer diagnosis."
          );
        }
      }
    }

    setDateConsistencyErrors(errors);
  }, [dob, dod]);

  // Validate name matching when deceased's last name changes
  useEffect(() => {
    if (!deceasedLastName || !part1Data) {
      setNameMatchWarning(null);
      return;
    }

    const filerLastName = part1Data.lastName?.toLowerCase();
    const filerFormerNames = part1Data.formerNames || [];
    const deceased = deceasedLastName.toLowerCase();

    // Check if deceased's last name matches filer's current last name
    if (filerLastName === deceased) {
      setNameMatchWarning(null);
      return;
    }

    // Check if deceased's last name matches any of filer's former names
    const matchesFormerName = filerFormerNames.some(
      (fn) =>
        fn.name.toLowerCase().includes(deceased) ||
        deceased.includes(fn.name.toLowerCase())
    );

    if (matchesFormerName) {
      setNameMatchWarning(null);
      return;
    }

    // No match found - show warning
    setNameMatchWarning(
      `The deceased's last name "${deceasedLastName}" doesn't match your current last name "${part1Data.lastName}"${filerFormerNames.length > 0 ? " or any of your former names" : ""}. You may need to provide additional documentation to establish the relationship (marriage certificate, birth certificate, etc.).`
    );
  }, [deceasedLastName, part1Data]);

  const handleSubmit = (data: Part2FormData) => {
    onSubmit(data as Part2ClaimantInfo);
  };

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      await onSubmit(data as Part2ClaimantInfo);
    },
    [onSubmit]
  );

  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise<boolean>((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handlePartialSubmit(data);
            resolve(true);
          },
          async () => {
            const formData = form.getValues();
            await handlePartialSubmit(formData);
            resolve(true); // Always allow progression
          }
        )();
      });
    };
    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handlePartialSubmit]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

      {/* Date Consistency Errors */}
      {dateConsistencyErrors.length > 0 && (
        <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="text-sm text-red-900">
                <p className="mb-2 font-semibold">
                  Date Inconsistency Detected
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {dateConsistencyErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  Please review and correct the dates before continuing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Name Match Warning */}
      {nameMatchWarning && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="text-sm text-yellow-900">
                <p className="mb-1 font-semibold">Name Mismatch Detected</p>
                <p>{nameMatchWarning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              importance="required"
              maxLength={12}
            />
            <FormField
              form={form}
              name="middleName"
              label="Middle Name"
              importance="optional"
              maxLength={12}
            />
            <FormField
              form={form}
              name="lastName"
              label="Last Name"
              importance="required"
              maxLength={20}
            />
          </div>

          {/* Former Names Display - Read-only for now since Part2 auto-populates from Part1 for self-filers */}
          {initialData?.formerNames && initialData.formerNames.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Former Names or Maiden Name
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                {initialData.formerNames.map((fn, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {fn.name}
                    {fn.type && fn.type !== "OTHER" && (
                      <span className="ml-2 text-gray-500">
                        ({fn.type.replace("_", " ")})
                      </span>
                    )}
                    {fn.year && (
                      <span className="ml-2 text-gray-500">[{fn.year}]</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Automatically populated from Part 1. This information will be
                included in the form submission.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              form={form}
              name="ssn"
              label="Social Security Number"
              type="ssn"
              importance="required"
              placeholder="XXX-XX-XXXX"
              helperText="Format: XXX-XX-XXXX"
            />
            <FormField
              form={form}
              name="dob"
              label="Date of Birth"
              type="date"
              importance="required"
            />
          </div>

          <FormField
            form={form}
            name="dod"
            label="Date of Death"
            type="date"
            importance="required"
            helperText="Required - Only survivors of deceased individuals can file claims on their behalf"
          />
        </CardContent>
      </Card>
    </form>
  );
}
