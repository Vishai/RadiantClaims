"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SurvivingBeneficiariesSignatures, SurvivingBeneficiary } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Info, AlertCircle, Plus, Trash2, Clock } from "lucide-react";
import { formatSSN } from "@/lib/utils";

// Validation schema for a single beneficiary
const beneficiarySchema = z.object({
  beneficiaryName: z.string().min(1, "Beneficiary name is required"),
  beneficiarySsn: z
    .string()
    .min(1, "Social Security number is required")
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  signatureDate: z.string().min(1, "Signature date is required"),
  signature: z.string().min(1, "Signature is required"),
  attorneyName: z.string().optional(),
  attorneyPhone: z.string().optional(),
});

// Validation schema for the form
const survivingBeneficiariesSchema = z.object({
  beneficiaries: z
    .array(beneficiarySchema)
    .min(1, "At least one beneficiary is required")
    .max(4, "Maximum of 4 beneficiaries allowed"),
});

type SurvivingBeneficiariesFormData = z.infer<typeof survivingBeneficiariesSchema>;

interface SurvivingBeneficiariesFormProps {
  initialData?: Partial<SurvivingBeneficiariesSignatures>;
  onSubmit: (data: SurvivingBeneficiariesSignatures) => void;
}

export default function SurvivingBeneficiariesForm({
  initialData,
  onSubmit,
}: SurvivingBeneficiariesFormProps) {
  const form = useForm<SurvivingBeneficiariesFormData>({
    resolver: zodResolver(survivingBeneficiariesSchema),
    defaultValues: {
      beneficiaries:
        initialData?.beneficiaries && initialData.beneficiaries.length > 0
          ? initialData.beneficiaries
          : [
              {
                beneficiaryName: "",
                beneficiarySsn: "",
                signatureDate: "",
                signature: "",
                attorneyName: "",
                attorneyPhone: "",
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  });

  const formErrors = form.formState.errors;

  // Auto-submit when form data changes (with validation)
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      // Check if all beneficiaries have required fields filled
      const allValid = values.beneficiaries.every(
        (b) =>
          b.beneficiaryName &&
          b.beneficiarySsn &&
          /^\d{3}-\d{2}-\d{4}$/.test(b.beneficiarySsn) &&
          b.signatureDate &&
          b.signature
      );

      if (allValid && values.beneficiaries.length > 0) {
        onSubmit(values as SurvivingBeneficiariesSignatures);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  // Auto-format SSN
  const handleSsnChange = (index: number, value: string) => {
    const formatted = formatSSN(value);
    form.setValue(`beneficiaries.${index}.beneficiarySsn`, formatted);
  };

  // Auto-format phone number
  const handlePhoneChange = (index: number, value: string) => {
    let formatted = value.replace(/\D/g, "");
    if (formatted.length > 10) formatted = formatted.slice(0, 10);
    if (formatted.length > 6) {
      formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3, 6)}-${formatted.slice(6)}`;
    } else if (formatted.length > 3) {
      formatted = `(${formatted.slice(0, 3)}) ${formatted.slice(3)}`;
    } else if (formatted.length > 0) {
      formatted = `(${formatted}`;
    }
    form.setValue(`beneficiaries.${index}.attorneyPhone`, formatted);
  };

  const addBeneficiary = () => {
    if (fields.length < 4) {
      append({
        beneficiaryName: "",
        beneficiarySsn: "",
        signatureDate: "",
        signature: "",
        attorneyName: "",
        attorneyPhone: "",
      });
    }
  };

  const removeBeneficiary = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Users className="h-5 w-5 text-terracotta-500" />
            Attached Signatures of Eligible Surviving Beneficiaries
          </CardTitle>
          <CardDescription>
            Optional for Part 6 (Surviving Children) - Expedites claim processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Purpose */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">Purpose of This Form</p>
                <p className="text-sm text-blue-800 mb-2">
                  Complete this form ONLY if you are filing as a surviving child (Part 6). This
                  form is optional but can significantly expedite the processing of your claim.
                </p>
                <p className="text-sm text-blue-800">
                  By having all eligible surviving beneficiaries sign this form, you help the
                  Department of Justice verify that all beneficiaries agree to the claim, which can
                  reduce processing time.
                </p>
              </div>
            </div>
          </div>

          {/* Expedited Processing Notice */}
          <div className="rounded-lg bg-terracotta-50 border border-terracotta-200 p-4">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-terracotta-900 mb-2">Expedite Your Claim</p>
                <p className="text-sm text-terracotta-800">
                  Including signatures from all eligible surviving beneficiaries can reduce claim
                  processing time by several weeks or months. While not mandatory, it is highly
                  recommended if possible.
                </p>
              </div>
            </div>
          </div>

          {/* Beneficiaries List */}
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-sage-200 bg-sage-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-sage-900">
                      Beneficiary {index + 1} of {fields.length}
                    </CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBeneficiary(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Beneficiary Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.beneficiaryName`}>
                      Name of Eligible Surviving Beneficiary <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.beneficiaryName`}
                      {...form.register(`beneficiaries.${index}.beneficiaryName`)}
                      placeholder="Full legal name"
                      className={
                        formErrors.beneficiaries?.[index]?.beneficiaryName ? "border-red-300" : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.beneficiaryName && (
                      <p className="text-sm text-red-600">
                        {formErrors.beneficiaries[index]?.beneficiaryName?.message}
                      </p>
                    )}
                  </div>

                  {/* Beneficiary SSN */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.beneficiarySsn`}>
                      Social Security Number <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.beneficiarySsn`}
                      value={form.watch(`beneficiaries.${index}.beneficiarySsn`)}
                      onChange={(e) => handleSsnChange(index, e.target.value)}
                      placeholder="XXX-XX-XXXX"
                      className={
                        formErrors.beneficiaries?.[index]?.beneficiarySsn ? "border-red-300" : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.beneficiarySsn && (
                      <p className="text-sm text-red-600">
                        {formErrors.beneficiaries[index]?.beneficiarySsn?.message}
                      </p>
                    )}
                  </div>

                  {/* Signature */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.signature`}>
                      Signature <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.signature`}
                      {...form.register(`beneficiaries.${index}.signature`)}
                      placeholder="Type full name (electronic signature)"
                      className={`text-lg ${
                        formErrors.beneficiaries?.[index]?.signature ? "border-red-300" : ""
                      }`}
                    />
                    {formErrors.beneficiaries?.[index]?.signature && (
                      <p className="text-sm text-red-600">
                        {formErrors.beneficiaries[index]?.signature?.message}
                      </p>
                    )}
                    <p className="text-xs text-sage-600">
                      For the PDF submission, each beneficiary will provide a handwritten signature
                    </p>
                  </div>

                  {/* Signature Date */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.signatureDate`}>
                      Date <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.signatureDate`}
                      {...form.register(`beneficiaries.${index}.signatureDate`)}
                      type="date"
                      className={
                        formErrors.beneficiaries?.[index]?.signatureDate ? "border-red-300" : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.signatureDate && (
                      <p className="text-sm text-red-600">
                        {formErrors.beneficiaries[index]?.signatureDate?.message}
                      </p>
                    )}
                  </div>

                  {/* Attorney Information (Optional) */}
                  <div className="pt-4 border-t border-sage-200">
                    <h4 className="text-sm font-semibold text-sage-900 mb-3">
                      Attorney Information (If Represented)
                    </h4>

                    {/* Attorney Name */}
                    <div className="space-y-2 mb-3">
                      <Label htmlFor={`beneficiaries.${index}.attorneyName`}>Attorney Name</Label>
                      <Input
                        id={`beneficiaries.${index}.attorneyName`}
                        {...form.register(`beneficiaries.${index}.attorneyName`)}
                        placeholder="Full name of attorney (if applicable)"
                      />
                      <p className="text-xs text-sage-600">
                        Leave blank if not represented by attorney
                      </p>
                    </div>

                    {/* Attorney Phone */}
                    <div className="space-y-2">
                      <Label htmlFor={`beneficiaries.${index}.attorneyPhone`}>
                        Attorney Phone Number
                      </Label>
                      <Input
                        id={`beneficiaries.${index}.attorneyPhone`}
                        value={form.watch(`beneficiaries.${index}.attorneyPhone`) || ""}
                        onChange={(e) => handlePhoneChange(index, e.target.value)}
                        placeholder="(XXX) XXX-XXXX"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Beneficiary Button */}
            {fields.length < 4 && (
              <Button
                type="button"
                variant="outline"
                onClick={addBeneficiary}
                className="w-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50 hover:text-terracotta-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Beneficiary ({fields.length} of 4 maximum)
              </Button>
            )}

            {/* Maximum Reached Notice */}
            {fields.length >= 4 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900">
                      Maximum of 4 beneficiaries reached. If there are more than 4 eligible
                      surviving beneficiaries, attach additional signature pages to the printed PDF.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Errors */}
          {formErrors.beneficiaries && typeof formErrors.beneficiaries === "object" && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-2">Please fix the following errors:</p>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside ml-2">
                    {Object.entries(formErrors.beneficiaries).map(([index, errors]) => {
                      if (typeof errors === "object" && errors !== null) {
                        return Object.entries(errors).map(([field, error]) => (
                          <li key={`${index}-${field}`}>
                            Beneficiary {Number(index) + 1}: {String((error as any)?.message || "")}
                          </li>
                        ));
                      }
                      return null;
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="rounded-lg bg-sage-50 border border-sage-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sage-900 mb-2">Important Information</p>
                <ul className="text-sm text-sage-800 space-y-1 list-disc list-inside ml-2">
                  <li>
                    This form is completely optional - your claim will be processed even without it
                  </li>
                  <li>
                    Include all eligible surviving children who are entitled to share in the RECA
                    compensation
                  </li>
                  <li>
                    Each beneficiary must sign individually - signatures cannot be on behalf of
                    others
                  </li>
                  <li>
                    If any beneficiary is represented by an attorney, include that attorney's
                    information
                  </li>
                  <li>
                    When printing the PDF, ensure each beneficiary signs in the designated signature
                    field
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
