"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SurvivingBeneficiariesSignatures } from "@/lib/reca/types";
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
    .min(0, "This form is optional")
    .max(4, "Maximum of 4 beneficiaries allowed per page"),
});

type SurvivingBeneficiariesFormData = z.infer<
  typeof survivingBeneficiariesSchema
>;

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
            Optional for Part 6 (Surviving Children) - Expedites claim
            processing
          </CardDescription>
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
                <p className="mb-2 text-sm text-blue-800">
                  Complete this form ONLY if you are filing as a surviving child
                  (Part 6). This form is <strong>optional</strong> but can
                  significantly expedite the processing of your claim.
                </p>
                <p className="text-sm text-blue-800">
                  By having all eligible surviving beneficiaries sign this form,
                  you help the Department of Justice verify that all
                  beneficiaries agree to the claim, which can reduce processing
                  time by several weeks or months.
                </p>
              </div>
            </div>
          </div>

          {/* Expedited Processing Notice */}
          <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
              <div>
                <p className="mb-2 font-semibold text-terracotta-900">
                  Expedite Your Claim
                </p>
                <p className="mb-2 text-sm text-terracotta-800">
                  <strong>With signatures:</strong> Including signatures from
                  all eligible surviving beneficiaries can reduce claim
                  processing time by several weeks or months.
                </p>
                <p className="text-sm text-terracotta-800">
                  <strong>Without signatures:</strong> If siblings don't sign,
                  the Department of Justice will independently contact each
                  unsigned sibling for individual confirmation before processing
                  your claim. This is required and will delay approval.
                </p>
              </div>
            </div>
          </div>

          {/* One Claim Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="mb-2 font-semibold text-amber-900">
                  One Claim for All Surviving Children
                </p>
                <p className="text-sm text-amber-800">
                  Only one RECA claim should be submitted on behalf of all
                  surviving children. Every eligible sibling must be listed as a
                  beneficiary in Part 6, and this form helps confirm that all
                  beneficiaries are aware and in agreement.
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
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Beneficiary Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.beneficiaryName`}>
                      Name of Eligible Surviving Beneficiary{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.beneficiaryName`}
                      {...form.register(
                        `beneficiaries.${index}.beneficiaryName`
                      )}
                      placeholder="Full legal name"
                      className={
                        formErrors.beneficiaries?.[index]?.beneficiaryName
                          ? "border-red-300"
                          : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.beneficiaryName && (
                      <p className="text-sm text-red-600">
                        {
                          formErrors.beneficiaries[index]?.beneficiaryName
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  {/* Beneficiary SSN */}
                  <div className="space-y-2">
                    <Label htmlFor={`beneficiaries.${index}.beneficiarySsn`}>
                      Social Security Number{" "}
                      <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id={`beneficiaries.${index}.beneficiarySsn`}
                      value={form.watch(
                        `beneficiaries.${index}.beneficiarySsn`
                      )}
                      onChange={(e) => handleSsnChange(index, e.target.value)}
                      placeholder="XXX-XX-XXXX"
                      className={
                        formErrors.beneficiaries?.[index]?.beneficiarySsn
                          ? "border-red-300"
                          : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.beneficiarySsn && (
                      <p className="text-sm text-red-600">
                        {
                          formErrors.beneficiaries[index]?.beneficiarySsn
                            ?.message
                        }
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
                        formErrors.beneficiaries?.[index]?.signature
                          ? "border-red-300"
                          : ""
                      }`}
                    />
                    {formErrors.beneficiaries?.[index]?.signature && (
                      <p className="text-sm text-red-600">
                        {formErrors.beneficiaries[index]?.signature?.message}
                      </p>
                    )}
                    <p className="text-xs text-sage-600">
                      For the PDF submission, each beneficiary will provide a
                      handwritten signature
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
                        formErrors.beneficiaries?.[index]?.signatureDate
                          ? "border-red-300"
                          : ""
                      }
                    />
                    {formErrors.beneficiaries?.[index]?.signatureDate && (
                      <p className="text-sm text-red-600">
                        {
                          formErrors.beneficiaries[index]?.signatureDate
                            ?.message
                        }
                      </p>
                    )}
                  </div>

                  {/* Attorney Information (Optional) */}
                  <div className="border-t border-sage-200 pt-4">
                    <h4 className="mb-3 text-sm font-semibold text-sage-900">
                      Attorney Information (If Represented)
                    </h4>

                    {/* Attorney Name */}
                    <div className="mb-3 space-y-2">
                      <Label htmlFor={`beneficiaries.${index}.attorneyName`}>
                        Attorney Name
                      </Label>
                      <Input
                        id={`beneficiaries.${index}.attorneyName`}
                        {...form.register(
                          `beneficiaries.${index}.attorneyName`
                        )}
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
                        value={
                          form.watch(`beneficiaries.${index}.attorneyPhone`) ||
                          ""
                        }
                        onChange={(e) =>
                          handlePhoneChange(index, e.target.value)
                        }
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
                <Plus className="mr-2 h-4 w-4" />
                Add Another Beneficiary ({fields.length} of 4 maximum)
              </Button>
            )}

            {/* Maximum Reached Notice */}
            {fields.length >= 4 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm text-amber-900">
                      Maximum of 4 beneficiaries reached. If there are more than
                      4 eligible surviving beneficiaries, attach additional
                      signature pages to the printed PDF.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Errors */}
          {formErrors.beneficiaries &&
            typeof formErrors.beneficiaries === "object" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="mb-2 font-semibold text-red-900">
                      Please fix the following errors:
                    </p>
                    <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-red-800">
                      {Object.entries(formErrors.beneficiaries).map(
                        ([index, errors]) => {
                          if (typeof errors === "object" && errors !== null) {
                            return Object.entries(errors).map(
                              ([field, error]) => (
                                <li key={`${index}-${field}`}>
                                  Beneficiary {Number(index) + 1}:{" "}
                                  {String((error as any)?.message || "")}
                                </li>
                              )
                            );
                          }
                          return null;
                        }
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

          {/* Important Information */}
          <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
              <div>
                <p className="mb-2 font-semibold text-sage-900">
                  Important Information
                </p>
                <ul className="ml-2 list-inside list-disc space-y-1 text-sm text-sage-800">
                  <li>
                    This form is completely optional - your claim will be
                    processed even without it
                  </li>
                  <li>
                    Include all eligible surviving children who are entitled to
                    share in the RECA compensation
                  </li>
                  <li>
                    Each beneficiary must sign individually - signatures cannot
                    be on behalf of others
                  </li>
                  <li>
                    If any beneficiary is represented by an attorney, include
                    that attorney's information
                  </li>
                  <li>
                    When printing the PDF, ensure each beneficiary signs in the
                    designated signature field
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
