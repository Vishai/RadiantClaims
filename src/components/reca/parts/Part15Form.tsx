"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part15LegalGuardian } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { Input } from "@/components/ui/input";
import { Shield, Info, AlertCircle, FileText } from "lucide-react";

// US States for dropdown
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

// Validation schema — relaxed for non-blocking navigation
const part15Schema = z.object({
  guardianFirstName: z.string().optional(),
  guardianMiddleName: z.string().optional(),
  guardianLastName: z.string().optional(),
  guardianAddress: z.string().optional(),
  guardianCity: z.string().optional(),
  guardianState: z.string().optional(),
  guardianZip: z.string().max(5).optional(),
  guardianPhoneDay: z.string().optional(),
  guardianPhoneEvening: z.string().optional(),
  guardianEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
});

type Part15FormData = z.infer<typeof part15Schema>;

interface Part15FormProps {
  initialData?: Partial<Part15LegalGuardian>;
  onSubmit: (data: Part15LegalGuardian) => void;
}

export default function Part15Form({ initialData, onSubmit }: Part15FormProps) {
  const form = useForm<Part15FormData>({
    resolver: zodResolver(part15Schema),
    defaultValues: {
      guardianFirstName: initialData?.guardianFirstName || "",
      guardianMiddleName: initialData?.guardianMiddleName || "",
      guardianLastName: initialData?.guardianLastName || "",
      guardianAddress: initialData?.guardianAddress || "",
      guardianCity: initialData?.guardianCity || "",
      guardianState: initialData?.guardianState || "",
      guardianZip: initialData?.guardianZip || "",
      guardianPhoneDay: initialData?.guardianPhoneDay || "",
      guardianPhoneEvening: initialData?.guardianPhoneEvening || "",
      guardianEmail: initialData?.guardianEmail || "",
    },
  });

  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.guardianFirstName &&
        values.guardianFirstName.trim().length > 0 &&
        values.guardianLastName &&
        values.guardianLastName.trim().length > 0 &&
        values.guardianAddress &&
        values.guardianAddress.trim().length > 0 &&
        values.guardianCity &&
        values.guardianCity.trim().length > 0 &&
        values.guardianState &&
        values.guardianState.trim().length > 0 &&
        values.guardianZip &&
        values.guardianZip.trim().length === 5
      ) {
        onSubmit(values as Part15LegalGuardian);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      onSubmit(data as Part15LegalGuardian);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Shield className="h-5 w-5 text-terracotta-500" />
            Part 15: Court Appointed Legal Guardians
          </CardTitle>
          <CardDescription>
            Complete only if you have a court-appointed legal guardian
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Important Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="mb-2 font-semibold text-amber-900">
                  Legal Guardianship vs. Power of Attorney
                </p>
                <div className="space-y-2 text-sm text-amber-800">
                  <p>
                    <strong>Legal Guardianship:</strong> A court-appointed
                    relationship where the guardian has legal authority to act
                    on behalf of the ward. Requires official court
                    documentation.
                  </p>
                  <p>
                    <strong>Power of Attorney:</strong> This is NOT legal
                    guardianship. If you only have power of attorney, do not
                    complete this section.
                  </p>
                  <p className="mt-3 font-semibold">
                    ⚠️ Skip this section if you do not have court-appointed
                    legal guardianship
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* When This Section Applies */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  When to Complete This Section
                </p>
                <p className="mb-2 text-sm text-blue-800">
                  Complete Part 15 only if:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                  <li>
                    You are a court-appointed guardian for the person filing the
                    claim
                  </li>
                  <li>
                    You have official court documentation of the guardianship
                  </li>
                  <li>The guardianship is currently active and in effect</li>
                </ul>
                <p className="mt-3 text-sm text-blue-800">
                  <strong>If you are not a legal guardian,</strong> proceed to
                  Part 16 (Signature).
                </p>
              </div>
            </div>
          </div>

          {/* Guardian Information Form */}
          <div className="space-y-6 border-t pt-4">
            <h3 className="text-base font-semibold text-sage-900">
              Legal Guardian Information
            </h3>

            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="guardianFirstName" importance="required">
                  First Name <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="guardianFirstName"
                  {...form.register("guardianFirstName")}
                  placeholder="Guardian's first name"
                  className={
                    formErrors.guardianFirstName ? "border-red-300" : ""
                  }
                />
                {formErrors.guardianFirstName && (
                  <p className="text-sm text-red-600">
                    {formErrors.guardianFirstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="guardianMiddleName" importance="optional">
                  Middle Name
                </FieldLabel>
                <Input
                  id="guardianMiddleName"
                  {...form.register("guardianMiddleName")}
                  placeholder="Middle name or initial"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="guardianLastName" importance="required">
                  Last Name <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="guardianLastName"
                  {...form.register("guardianLastName")}
                  placeholder="Guardian's last name"
                  className={
                    formErrors.guardianLastName ? "border-red-300" : ""
                  }
                />
                {formErrors.guardianLastName && (
                  <p className="text-sm text-red-600">
                    {formErrors.guardianLastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <FieldLabel htmlFor="guardianAddress" importance="required">
                Mailing Address <span className="text-red-600">*</span>
              </FieldLabel>
              <Input
                id="guardianAddress"
                {...form.register("guardianAddress")}
                placeholder="Street address"
                className={formErrors.guardianAddress ? "border-red-300" : ""}
              />
              {formErrors.guardianAddress && (
                <p className="text-sm text-red-600">
                  {formErrors.guardianAddress.message}
                </p>
              )}
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="guardianCity" importance="required">
                  City <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="guardianCity"
                  {...form.register("guardianCity")}
                  placeholder="City"
                  className={formErrors.guardianCity ? "border-red-300" : ""}
                />
                {formErrors.guardianCity && (
                  <p className="text-sm text-red-600">
                    {formErrors.guardianCity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="guardianState" importance="required">
                  State <span className="text-red-600">*</span>
                </FieldLabel>
                <select
                  id="guardianState"
                  {...form.register("guardianState")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    formErrors.guardianState ? "border-red-300" : ""
                  }`}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {formErrors.guardianState && (
                  <p className="text-sm text-red-600">
                    {formErrors.guardianState.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="guardianZip" importance="required">
                  Zip Code <span className="text-red-600">*</span>
                </FieldLabel>
                <Input
                  id="guardianZip"
                  {...form.register("guardianZip")}
                  placeholder="12345"
                  maxLength={5}
                  className={formErrors.guardianZip ? "border-red-300" : ""}
                />
                {formErrors.guardianZip && (
                  <p className="text-sm text-red-600">
                    {formErrors.guardianZip.message}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="guardianPhoneDay" importance="optional">
                  Phone Number (day)
                </FieldLabel>
                <Input
                  id="guardianPhoneDay"
                  {...form.register("guardianPhoneDay")}
                  placeholder="555-123-4567"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="guardianPhoneEvening"
                  importance="optional"
                >
                  Phone Number (evening)
                </FieldLabel>
                <Input
                  id="guardianPhoneEvening"
                  {...form.register("guardianPhoneEvening")}
                  placeholder="555-123-4567"
                  type="tel"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <FieldLabel htmlFor="guardianEmail" importance="optional">
                Email Address
              </FieldLabel>
              <Input
                id="guardianEmail"
                {...form.register("guardianEmail")}
                placeholder="guardian@example.com"
                type="email"
                className={formErrors.guardianEmail ? "border-red-300" : ""}
              />
              {formErrors.guardianEmail && (
                <p className="text-sm text-red-600">
                  {formErrors.guardianEmail.message}
                </p>
              )}
            </div>
          </div>

          {/* Required Documentation */}
          <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
            <div className="flex gap-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
              <div>
                <p className="mb-2 font-semibold text-terracotta-900">
                  Required Documentation
                </p>
                <p className="mb-3 text-sm text-terracotta-800">
                  If you are completing this section as a legal guardian, you
                  must provide:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-2 text-sm text-terracotta-800">
                  <li>
                    <strong>Court Order:</strong> Certified or original copy of
                    court documentation showing power of guardianship
                  </li>
                  <li>
                    <strong>Certification:</strong> Must include institutional
                    seal (raised, colored, or signed) OR cover letter on court
                    letterhead stating "true and accurate copy"
                  </li>
                </ul>
                <p className="mt-3 text-sm text-terracotta-800">
                  <strong>Note:</strong> These documents will be requested
                  during the document upload phase of your claim.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardianship Verification */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div>
              <p className="mb-2 font-semibold text-sage-900">
                RECA Program Verification
              </p>
              <p className="text-sm text-sage-700">
                The RECA Program will verify the guardianship documentation with
                the issuing court. Fraudulent guardianship claims are subject to
                criminal prosecution under 18 U.S.C. §§ 287, 1001.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Step:</strong> After completing this section (or if
                skipping because you do not have a legal guardian), you will
                move on to Part 16 (Signature), the final required section of
                the RECA claim form.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
