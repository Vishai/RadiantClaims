"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CertificationOfIdentity } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Info, AlertCircle, UserPlus } from "lucide-react";
import { FormField } from "@/components/form-field";

// Validation schema
const certificationSchema = z.object({
  // Section 1 - Required
  fullName: z.string().min(1, "Full name is required"),
  citizenshipStatus: z.enum(["US Citizen", "Lawful Permanent Resident"], {
    required_error: "Citizenship status is required",
  }),
  ssn: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || /^\d{3}-\d{2}-\d{4}$/.test(val),
      "SSN must be in format XXX-XX-XXXX if provided"
    ),
  currentAddress: z.string().min(1, "Current address is required"),
  dob: z.string().min(1, "Date of birth is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  signature: z.string().min(1, "Signature is required"),
  signatureDate: z.string().min(1, "Signature date is required"),
  // Section 2 - Optional
  authorizedPersonName: z.string().optional(),
  relationshipToRequester: z.string().optional(),
  authorizedPhoneNumber: z.string().optional(),
  authorizedCurrentAddress: z.string().optional(),
  authorizedSignature: z.string().optional(),
  authorizedSignatureDate: z.string().optional(),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

interface CertificationOfIdentityFormProps {
  initialData?: Partial<CertificationOfIdentity>;
  onSubmit: (data: CertificationOfIdentity) => void;
}

export default function CertificationOfIdentityForm({
  initialData,
  onSubmit,
}: CertificationOfIdentityFormProps) {
  const [includeSection2, setIncludeSection2] = useState(
    !!(initialData?.authorizedPersonName || initialData?.authorizedSignature)
  );

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      citizenshipStatus: initialData?.citizenshipStatus || undefined,
      ssn: initialData?.ssn || "",
      currentAddress: initialData?.currentAddress || "",
      dob: initialData?.dob || "",
      placeOfBirth: initialData?.placeOfBirth || "",
      signature: initialData?.signature || "",
      signatureDate: initialData?.signatureDate || "",
      authorizedPersonName: initialData?.authorizedPersonName || "",
      relationshipToRequester: initialData?.relationshipToRequester || "",
      authorizedPhoneNumber: initialData?.authorizedPhoneNumber || "",
      authorizedCurrentAddress: initialData?.authorizedCurrentAddress || "",
      authorizedSignature: initialData?.authorizedSignature || "",
      authorizedSignatureDate: initialData?.authorizedSignatureDate || "",
    },
  });

  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Only submit if all required fields are filled
      if (
        values.fullName &&
        values.citizenshipStatus &&
        values.currentAddress &&
        values.dob &&
        values.placeOfBirth &&
        values.signature &&
        values.signatureDate
      ) {
        // If SSN is provided, validate format
        if (values.ssn && values.ssn.trim() !== "") {
          const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
          if (!ssnRegex.test(values.ssn)) {
            return; // Don't submit if SSN format is invalid
          }
        }
        onSubmit(values as CertificationOfIdentity);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Auto-format phone number
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    form.setValue("authorizedPhoneNumber", value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <ShieldCheck className="h-5 w-5 text-terracotta-500" />
            Certification of Identity and Privacy Act Release
          </CardTitle>
          <CardDescription>Required for all RECA claims</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Purpose */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  Purpose of This Form
                </p>
                <p className="text-sm text-blue-800">
                  This form certifies your identity and authorizes the release
                  of information under the Privacy Act. It helps the Department
                  of Justice verify your identity and process your claim
                  efficiently.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Certification of Identity */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-sage-900">
                Section 1: Certification of Identity
              </h3>
              <p className="mt-1 text-sm text-sage-600">All fields required</p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Legal Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                placeholder="First Middle Last"
                className={formErrors.fullName ? "border-red-300" : ""}
              />
              {formErrors.fullName && (
                <p className="text-sm text-red-600">
                  {formErrors.fullName.message}
                </p>
              )}
            </div>

            {/* Citizenship Status */}
            <div className="space-y-2">
              <Label htmlFor="citizenshipStatus">
                Citizenship Status <span className="text-red-600">*</span>
              </Label>
              <Select
                value={form.watch("citizenshipStatus")}
                onValueChange={(value) =>
                  form.setValue(
                    "citizenshipStatus",
                    value as "US Citizen" | "Lawful Permanent Resident"
                  )
                }
              >
                <SelectTrigger
                  className={
                    formErrors.citizenshipStatus ? "border-red-300" : ""
                  }
                >
                  <SelectValue placeholder="Select citizenship status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US Citizen">US Citizen</SelectItem>
                  <SelectItem value="Lawful Permanent Resident">
                    Lawful Permanent Resident
                  </SelectItem>
                </SelectContent>
              </Select>
              {formErrors.citizenshipStatus && (
                <p className="text-sm text-red-600">
                  {formErrors.citizenshipStatus.message}
                </p>
              )}
              <p className="text-xs text-sage-600">
                Note: Non-citizens will be processed under the Freedom of
                Information Act (FOIA)
              </p>
            </div>

            {/* SSN (Optional but Recommended) */}
            <FormField
              form={form}
              name="ssn"
              label="Social Security Number"
              type="ssn"
              placeholder="XXX-XX-XXXX (optional)"
              helperText="Voluntary but highly recommended - helps locate records more quickly"
            />

            {/* Current Address */}
            <div className="space-y-2">
              <Label htmlFor="currentAddress">
                Current Mailing Address <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="currentAddress"
                {...form.register("currentAddress")}
                placeholder="Street address, City, State, ZIP"
                rows={3}
                className={formErrors.currentAddress ? "border-red-300" : ""}
              />
              {formErrors.currentAddress && (
                <p className="text-sm text-red-600">
                  {formErrors.currentAddress.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">
                Date of Birth <span className="text-red-600">*</span>
              </Label>
              <Input
                id="dob"
                {...form.register("dob")}
                type="date"
                className={formErrors.dob ? "border-red-300" : ""}
              />
              {formErrors.dob && (
                <p className="text-sm text-red-600">{formErrors.dob.message}</p>
              )}
            </div>

            {/* Place of Birth */}
            <div className="space-y-2">
              <Label htmlFor="placeOfBirth">
                Place of Birth <span className="text-red-600">*</span>
              </Label>
              <Input
                id="placeOfBirth"
                {...form.register("placeOfBirth")}
                placeholder="City, State/Country"
                className={formErrors.placeOfBirth ? "border-red-300" : ""}
              />
              {formErrors.placeOfBirth && (
                <p className="text-sm text-red-600">
                  {formErrors.placeOfBirth.message}
                </p>
              )}
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label htmlFor="signature">
                Signature <span className="text-red-600">*</span>
              </Label>
              <Input
                id="signature"
                {...form.register("signature")}
                placeholder="Type your full name (electronic signature)"
                className={`text-lg ${formErrors.signature ? "border-red-300" : ""}`}
              />
              {formErrors.signature && (
                <p className="text-sm text-red-600">
                  {formErrors.signature.message}
                </p>
              )}
            </div>

            {/* Signature Date */}
            <div className="space-y-2">
              <Label htmlFor="signatureDate">
                Date <span className="text-red-600">*</span>
              </Label>
              <Input
                id="signatureDate"
                {...form.register("signatureDate")}
                type="date"
                className={formErrors.signatureDate ? "border-red-300" : ""}
              />
              {formErrors.signatureDate && (
                <p className="text-sm text-red-600">
                  {formErrors.signatureDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Section 2 Toggle */}
          <div className="border-t pt-4">
            <div className="flex items-start gap-3 rounded-lg border border-sage-300 bg-sage-50 p-4">
              <Checkbox
                id="includeSection2"
                checked={includeSection2}
                onCheckedChange={(checked) =>
                  setIncludeSection2(checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="includeSection2"
                  className="cursor-pointer text-sm font-medium leading-snug"
                >
                  <UserPlus className="mr-1 inline h-4 w-4" />
                  Add Section 2: Authorization to Release Information to Another
                  Person (OPTIONAL)
                </label>
                <p className="mt-1 text-xs text-sage-600">
                  Check this box if you want to authorize someone else to
                  receive information about your claim on your behalf
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Authorization to Release Information (Optional) */}
          {includeSection2 && (
            <div className="space-y-4 border-t pt-4">
              <div className="border-b pb-2">
                <h3 className="text-base font-semibold text-sage-900">
                  Section 2: Authorization to Release Information to Another
                  Person
                </h3>
                <p className="mt-1 text-sm text-sage-600">
                  Optional - Complete only if authorizing another person
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm text-amber-900">
                      By completing this section, you authorize the Department
                      of Justice to share information about your claim with the
                      person listed below. This person will be able to discuss
                      your claim status and receive updates on your behalf.
                    </p>
                  </div>
                </div>
              </div>

              {/* Authorized Person Name */}
              <div className="space-y-2">
                <Label htmlFor="authorizedPersonName">
                  Name of Authorized Person
                </Label>
                <Input
                  id="authorizedPersonName"
                  {...form.register("authorizedPersonName")}
                  placeholder="Full legal name"
                />
              </div>

              {/* Relationship */}
              <div className="space-y-2">
                <Label htmlFor="relationshipToRequester">
                  Relationship to You
                </Label>
                <Input
                  id="relationshipToRequester"
                  {...form.register("relationshipToRequester")}
                  placeholder="e.g., Spouse, Child, Attorney, Advocate"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="authorizedPhoneNumber">Phone Number</Label>
                <Input
                  id="authorizedPhoneNumber"
                  value={form.watch("authorizedPhoneNumber")}
                  onChange={handlePhoneChange}
                  placeholder="(XXX) XXX-XXXX"
                />
              </div>

              {/* Current Address */}
              <div className="space-y-2">
                <Label htmlFor="authorizedCurrentAddress">
                  Mailing Address
                </Label>
                <Textarea
                  id="authorizedCurrentAddress"
                  {...form.register("authorizedCurrentAddress")}
                  placeholder="Street address, City, State, ZIP"
                  rows={3}
                />
              </div>

              {/* Authorized Person Signature */}
              <div className="space-y-2">
                <Label htmlFor="authorizedSignature">
                  Authorized Person's Signature
                </Label>
                <Input
                  id="authorizedSignature"
                  {...form.register("authorizedSignature")}
                  placeholder="Type full name (electronic signature)"
                  className="text-lg"
                />
                <p className="text-xs text-sage-600">
                  The authorized person must sign to acknowledge this
                  authorization
                </p>
              </div>

              {/* Authorized Signature Date */}
              <div className="space-y-2">
                <Label htmlFor="authorizedSignatureDate">Date</Label>
                <Input
                  id="authorizedSignatureDate"
                  {...form.register("authorizedSignatureDate")}
                  type="date"
                />
              </div>
            </div>
          )}

          {/* Privacy Act Statement */}
          <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
              <div>
                <p className="mb-2 font-semibold text-sage-900">
                  Privacy Act Statement
                </p>
                <p className="mb-2 text-sm text-sage-800">
                  The Privacy Act of 1974 (5 U.S.C. § 552a) requires that you be
                  informed of the following:
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-sage-800">
                  <li>
                    Authority: Radiation Exposure Compensation Act, 42 U.S.C. §
                    2210 note (2000)
                  </li>
                  <li>
                    Purpose: To verify your identity and process your RECA claim
                  </li>
                  <li>
                    Routine Uses: May be shared with other federal agencies as
                    needed to process your claim
                  </li>
                  <li>
                    Disclosure: Voluntary, but failure to provide may delay or
                    prevent claim processing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
