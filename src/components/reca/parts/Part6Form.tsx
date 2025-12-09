"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part6SurvivingChild, RECAFormData } from "@/lib/reca/types";
import { useAutofill } from "@/lib/reca/useAutofill";
import { AutofillInfoBanner } from "@/components/reca/AutofillBadge";
import { DocumentRequirementsInline } from "@/components/reca/DocumentRequirementsInline";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  Users,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  UserPlus,
  FileText,
} from "lucide-react";

// Validation schema for name change records
const nameChangeSchema = z
  .object({
    previousName: z.string().min(1, "Previous name is required"),
    dateOfChange: z.string().min(1, "Date of change is required"),
    reasonForChange: z.enum([
      "MARRIAGE",
      "DIVORCE",
      "LEGAL_NAME_CHANGE",
      "OTHER",
    ]),
    otherReason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonForChange === "OTHER" && !data.otherReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the reason for name change",
        path: ["otherReason"],
      });
    }
  });

// Validation schema for sibling information
const siblingSchema = z
  .object({
    name: z.string().min(1, "Sibling name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    cityOfBirth: z.string().min(1, "City of birth is required"),
    stateOfBirth: z.string().min(1, "State of birth is required"),
    isDeceased: z.enum(["YES", "NO"]),
    dateOfDeath: z.string().optional(),
    cityOfDeath: z.string().optional(),
    stateOfDeath: z.string().optional(),
    hasDeathCertificate: z.enum(["YES", "NO", "WILL_OBTAIN"]).optional(),
    deathCertificateFileKey: z.string().optional(),
    currentAddress: z.string().optional(),
    phoneNumber: z.string().optional(),
    // Name change tracking
    hadNameChange: z.enum(["YES", "NO"]).optional(),
    nameChangeHistory: z.array(nameChangeSchema).optional(),
    originalLastName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If deceased, require death information
    if (data.isDeceased === "YES") {
      if (!data.dateOfDeath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of death is required for deceased siblings",
          path: ["dateOfDeath"],
        });
      }
      if (!data.cityOfDeath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "City of death is required for deceased siblings",
          path: ["cityOfDeath"],
        });
      }
      if (!data.stateOfDeath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "State of death is required for deceased siblings",
          path: ["stateOfDeath"],
        });
      }
      if (!data.hasDeathCertificate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Death certificate status is required for deceased siblings",
          path: ["hasDeathCertificate"],
        });
      }
    }
    // If alive, require contact information
    if (data.isDeceased === "NO") {
      if (!data.currentAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Current address is required for living siblings",
          path: ["currentAddress"],
        });
      }
      if (!data.phoneNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required for living siblings",
          path: ["phoneNumber"],
        });
      }
    }
    // If had name change, require history
    if (data.hadNameChange === "YES") {
      if (!data.originalLastName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Original last name is required when you've had a name change",
          path: ["originalLastName"],
        });
      }
      if (!data.nameChangeHistory || data.nameChangeHistory.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please add at least one name change record",
          path: ["nameChangeHistory"],
        });
      }
    }
  });

// Main form validation schema
const part6Schema = z
  .object({
    claimantDeceased: z.enum(["YES", "NO"]),
    claimantEverMarried: z.enum(["YES", "NO"]),
    claimantSpouses: z
      .array(
        z.object({
          spouseName: z.string().min(1, "Spouse name is required"),
          marriageStart: z.string().min(1, "Marriage start date is required"),
          marriageEnd: z.string().min(1, "Marriage end date is required"),
        })
      )
      .optional(),
    childType: z.enum(["NATURAL", "ADOPTED CHILD", "STEP-CHILD"]),
    otherChildrenExist: z.enum(["YES", "NO"]),
    siblings: z.array(siblingSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // If other children exist, require siblings array
    if (
      data.otherChildrenExist === "YES" &&
      (!data.siblings || data.siblings.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please add at least one sibling",
        path: ["siblings"],
      });
    }

    // If claimant was married, require spouse information
    if (
      data.claimantEverMarried === "YES" &&
      (!data.claimantSpouses || data.claimantSpouses.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please add claimant's spouse information",
        path: ["claimantSpouses"],
      });
    }
  });

type Part6FormData = z.infer<typeof part6Schema>;

interface Part6FormProps {
  initialData?: Partial<Part6SurvivingChild>;
  onSubmit: (data: Part6SurvivingChild) => void;
  currentFormData?: Partial<RECAFormData>; // For autofill
}

export default function Part6Form({
  initialData,
  onSubmit,
  currentFormData = {},
}: Part6FormProps) {
  // Get autofill defaults
  const autofill = useAutofill({
    targetPart: "part_6",
    currentFormData,
  });

  // Merge autofill with initial data
  const defaultValues = autofill.mergeDefaults({
    claimantDeceased: initialData?.claimantDeceased || "YES",
    claimantEverMarried: initialData?.claimantEverMarried || "NO",
    claimantSpouses: initialData?.claimantSpouses || [],
    childType: initialData?.childType || "NATURAL",
    otherChildrenExist: initialData?.otherChildrenExist || "NO",
    siblings: initialData?.siblings || [],
  });

  const form = useForm<Part6FormData>({
    resolver: zodResolver(part6Schema),
    defaultValues,
  });

  const {
    fields: siblingFields,
    append: appendSibling,
    remove: removeSibling,
  } = useFieldArray({
    control: form.control,
    name: "siblings",
  });

  const {
    fields: spouseFields,
    append: appendSpouse,
    remove: removeSpouse,
  } = useFieldArray({
    control: form.control,
    name: "claimantSpouses",
  });

  const watchClaimantMarried = form.watch("claimantEverMarried");
  const watchOtherChildrenExist = form.watch("otherChildrenExist");

  // Auto-submit when form is valid
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      const isValid = form.formState.isValid;

      if (isValid) {
        onSubmit(values as Part6SurvivingChild);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  const formErrors = form.formState.errors;

  // Get autofill sources for banner
  const autofilledSources = Array.from(
    new Set(
      autofill.autofilledFields
        .map((field) => autofill.getSource(field)?.label)
        .filter((label): label is string => Boolean(label))
    )
  );

  return (
    <div className="space-y-6">
      {/* Autofill Info Banner */}
      {autofill.autofilledFields.length > 0 && (
        <AutofillInfoBanner
          autofilledCount={autofill.autofilledFields.length}
          sources={autofilledSources}
        />
      )}

      {/* Document Requirements Inline */}
      <DocumentRequirementsInline
        formData={currentFormData}
        relatedFormSection="part_6"
        variant="card"
        title="Documents You'll Need for This Section"
        description="Based on your answers below, you'll need to upload these documents later in the process"
      />

      {/* Header Information */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Users className="h-5 w-5 text-terracotta-500" />
            Part 6: Surviving Child Information
          </CardTitle>
          <CardDescription>
            Complete this section if you are a surviving child of the person who
            became ill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-2 font-semibold text-blue-900">
                    Important Requirements
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
                    <li>
                      List all siblings (brothers and sisters of the person who
                      became ill)
                    </li>
                    <li>
                      For deceased siblings, provide death certificate or
                      indicate you will obtain one
                    </li>
                    <li>
                      For living siblings, provide current address and phone
                      number
                    </li>
                    <li>
                      For anyone who changed their name, provide their name
                      change history
                    </li>
                    <li>
                      Awards are shared equally among all eligible surviving
                      children
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
                <div>
                  <p className="mb-2 font-semibold text-terracotta-900">
                    Filing on Behalf of All Surviving Children
                  </p>
                  <p className="mb-2 text-sm text-terracotta-800">
                    Only <strong>one claim</strong> should be submitted for all
                    surviving children combined. All eligible siblings must be
                    listed as beneficiaries on this single claim.
                  </p>
                  <p className="text-sm text-terracotta-800">
                    <strong>Pro tip:</strong> Having all siblings sign the
                    optional "Surviving Beneficiaries Signatures" form can speed
                    up processing significantly. Otherwise, the DOJ will contact
                    each sibling individually, which may delay approval by
                    several weeks or months.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Verification */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Claimant Deceased */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Is the person who became ill deceased?{" "}
              <span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={form.watch("claimantDeceased")}
              onValueChange={(value) =>
                form.setValue("claimantDeceased", value as "YES" | "NO")
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="deceased-yes" />
                <Label
                  htmlFor="deceased-yes"
                  className="cursor-pointer font-normal"
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="deceased-no" />
                <Label
                  htmlFor="deceased-no"
                  className="cursor-pointer font-normal"
                >
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Claimant Ever Married */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Was the person who became ill ever married?{" "}
              <span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={form.watch("claimantEverMarried")}
              onValueChange={(value) =>
                form.setValue("claimantEverMarried", value as "YES" | "NO")
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="married-yes" />
                <Label
                  htmlFor="married-yes"
                  className="cursor-pointer font-normal"
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="married-no" />
                <Label
                  htmlFor="married-no"
                  className="cursor-pointer font-normal"
                >
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Claimant's Spouses */}
          {watchClaimantMarried === "YES" && (
            <div className="space-y-4 border-t border-sage-200 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Claimant's Marriage History
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSpouse({
                      spouseName: "",
                      marriageStart: "",
                      marriageEnd: "",
                    })
                  }
                  className="border-terracotta-300 text-terracotta-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Spouse
                </Button>
              </div>

              {spouseFields.map((field, index) => (
                <Card key={field.id} className="border-sage-200 bg-sage-50/30">
                  <CardContent className="space-y-3 pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-sage-900">
                        Spouse {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpouse(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`claimantSpouses.${index}.spouseName`}>
                        Spouse Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id={`claimantSpouses.${index}.spouseName`}
                        {...form.register(
                          `claimantSpouses.${index}.spouseName`
                        )}
                        placeholder="Full legal name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`claimantSpouses.${index}.marriageStart`}
                        >
                          Marriage Start <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id={`claimantSpouses.${index}.marriageStart`}
                          {...form.register(
                            `claimantSpouses.${index}.marriageStart`
                          )}
                          type="date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`claimantSpouses.${index}.marriageEnd`}>
                          Marriage End <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id={`claimantSpouses.${index}.marriageEnd`}
                          {...form.register(
                            `claimantSpouses.${index}.marriageEnd`
                          )}
                          type="date"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Child Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Your relationship to the person who became ill{" "}
              <span className="text-red-600">*</span>
            </Label>
            <Select
              value={form.watch("childType")}
              onValueChange={(value) =>
                form.setValue("childType", value as any)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NATURAL">Natural Child</SelectItem>
                <SelectItem value="ADOPTED CHILD">Adopted Child</SelectItem>
                <SelectItem value="STEP-CHILD">Step-Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sibling Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Users className="h-5 w-5 text-terracotta-500" />
            Sibling Information
          </CardTitle>
          <CardDescription>
            List all siblings (other children of the person who became ill)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Do other children exist */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Did the person who became ill have other children?{" "}
              <span className="text-red-600">*</span>
            </Label>
            <RadioGroup
              value={form.watch("otherChildrenExist")}
              onValueChange={(value) =>
                form.setValue("otherChildrenExist", value as "YES" | "NO")
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="siblings-yes" />
                <Label
                  htmlFor="siblings-yes"
                  className="cursor-pointer font-normal"
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="siblings-no" />
                <Label
                  htmlFor="siblings-no"
                  className="cursor-pointer font-normal"
                >
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Siblings List */}
          {watchOtherChildrenExist === "YES" && (
            <div className="space-y-4 border-t border-sage-200 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">All Siblings</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendSibling({
                      name: "",
                      dateOfBirth: "",
                      cityOfBirth: "",
                      stateOfBirth: "",
                      isDeceased: "NO",
                      currentAddress: "",
                      phoneNumber: "",
                      hadNameChange: "NO",
                    })
                  }
                  className="border-terracotta-300 text-terracotta-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Sibling
                </Button>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-amber-900">
                        Important: List ALL Siblings
                      </p>
                      <p className="text-sm text-amber-800">
                        You must list all siblings, including yourself. For each
                        deceased sibling, you must provide a death certificate
                        or indicate that you will obtain one. This is required
                        by the Department of Justice.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="mb-2 text-sm font-semibold text-blue-900">
                        About Sibling Signatures
                      </p>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">•</span>
                          <span>
                            <strong>
                              One claim covers all surviving children.
                            </strong>{" "}
                            Every eligible sibling must be listed as a
                            beneficiary on this claim.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">•</span>
                          <span>
                            <strong>Signatures expedite processing.</strong>{" "}
                            Having all siblings sign the claim (via the
                            Surviving Beneficiaries form) can significantly
                            speed up approval. This is optional but strongly
                            recommended.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">•</span>
                          <span>
                            <strong>DOJ will contact unsigned siblings.</strong>{" "}
                            If not all siblings sign, the Department of Justice
                            will independently reach out to those who didn't
                            sign for individual confirmation before processing
                            your claim. This can delay approval by weeks or
                            months.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-blue-600">•</span>
                          <span>
                            <strong>
                              Provide accurate contact information.
                            </strong>{" "}
                            Make sure the addresses and phone numbers you
                            provide are current so the DOJ can reach your
                            siblings if needed.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-terracotta-900">
                        Best Practice
                      </p>
                      <p className="text-sm text-terracotta-800">
                        To avoid delays: List all eligible siblings here with
                        accurate contact information, and use the "Surviving
                        Beneficiaries Signatures" form (optional) to collect
                        signatures from all siblings. This can reduce processing
                        time significantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {siblingFields.map((field, index) => (
                <SiblingCard
                  key={field.id}
                  index={index}
                  form={form}
                  onRemove={() => removeSibling(index)}
                  formErrors={formErrors}
                />
              ))}

              {siblingFields.length === 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <p className="text-sm text-amber-900">
                      Please add at least one sibling using the "Add Sibling"
                      button above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Validation Errors */}
      {Object.keys(formErrors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="mb-2 font-semibold text-red-900">
                Please fix the following errors:
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-red-800">
                {Object.entries(formErrors).map(([key, error]) => (
                  <li key={key}>
                    {typeof error === "object" && "message" in error
                      ? error.message
                      : `Error in ${key}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for each sibling card to manage nested field arrays
interface SiblingCardProps {
  index: number;
  form: any;
  onRemove: () => void;
  formErrors: any;
}

function SiblingCard({ index, form, onRemove, formErrors }: SiblingCardProps) {
  const {
    fields: nameChangeFields,
    append: appendNameChange,
    remove: removeNameChange,
  } = useFieldArray({
    control: form.control,
    name: `siblings.${index}.nameChangeHistory`,
  });

  const watchHadNameChange = form.watch(`siblings.${index}.hadNameChange`);
  const watchIsDeceased = form.watch(`siblings.${index}.isDeceased`);

  return (
    <Card className="border-sage-200 bg-sage-50/30">
      <CardContent className="space-y-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-base font-semibold text-sage-900">
            Sibling {index + 1}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Remove
          </Button>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor={`siblings.${index}.name`}>
            Full Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`siblings.${index}.name`}
            {...form.register(`siblings.${index}.name`)}
            placeholder="Full legal name"
            className={
              formErrors.siblings?.[index]?.name ? "border-red-300" : ""
            }
          />
          {formErrors.siblings?.[index]?.name && (
            <p className="text-sm text-red-600">
              {formErrors.siblings[index]?.name?.message}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor={`siblings.${index}.dateOfBirth`}>
            Date of Birth <span className="text-red-600">*</span>
          </Label>
          <Input
            id={`siblings.${index}.dateOfBirth`}
            {...form.register(`siblings.${index}.dateOfBirth`)}
            type="date"
            className={
              formErrors.siblings?.[index]?.dateOfBirth ? "border-red-300" : ""
            }
          />
          {formErrors.siblings?.[index]?.dateOfBirth && (
            <p className="text-sm text-red-600">
              {formErrors.siblings[index]?.dateOfBirth?.message}
            </p>
          )}
        </div>

        {/* City and State of Birth */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`siblings.${index}.cityOfBirth`}>
              City of Birth <span className="text-red-600">*</span>
            </Label>
            <Input
              id={`siblings.${index}.cityOfBirth`}
              {...form.register(`siblings.${index}.cityOfBirth`)}
              placeholder="City"
              className={
                formErrors.siblings?.[index]?.cityOfBirth
                  ? "border-red-300"
                  : ""
              }
            />
            {formErrors.siblings?.[index]?.cityOfBirth && (
              <p className="text-sm text-red-600">
                {formErrors.siblings[index]?.cityOfBirth?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`siblings.${index}.stateOfBirth`}>
              State of Birth <span className="text-red-600">*</span>
            </Label>
            <Input
              id={`siblings.${index}.stateOfBirth`}
              {...form.register(`siblings.${index}.stateOfBirth`)}
              placeholder="State"
              className={
                formErrors.siblings?.[index]?.stateOfBirth
                  ? "border-red-300"
                  : ""
              }
            />
            {formErrors.siblings?.[index]?.stateOfBirth && (
              <p className="text-sm text-red-600">
                {formErrors.siblings[index]?.stateOfBirth?.message}
              </p>
            )}
          </div>
        </div>

        {/* Name Change Section */}
        <div className="space-y-3 border-t border-sage-200 pt-4">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="h-4 w-4 text-terracotta-500" />
            Has this person ever changed their name?
          </Label>
          <RadioGroup
            value={form.watch(`siblings.${index}.hadNameChange`) || "NO"}
            onValueChange={(value) =>
              form.setValue(
                `siblings.${index}.hadNameChange`,
                value as "YES" | "NO"
              )
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="YES"
                id={`sibling-${index}-namechange-yes`}
              />
              <Label
                htmlFor={`sibling-${index}-namechange-yes`}
                className="cursor-pointer font-normal"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="NO"
                id={`sibling-${index}-namechange-no`}
              />
              <Label
                htmlFor={`sibling-${index}-namechange-no`}
                className="cursor-pointer font-normal"
              >
                No
              </Label>
            </div>
          </RadioGroup>

          {watchHadNameChange === "YES" && (
            <div className="space-y-4 pt-3">
              {/* Original Last Name */}
              <div className="space-y-2">
                <Label htmlFor={`siblings.${index}.originalLastName`}>
                  Original Last Name (at birth){" "}
                  <span className="text-red-600">*</span>
                </Label>
                <Input
                  id={`siblings.${index}.originalLastName`}
                  {...form.register(`siblings.${index}.originalLastName`)}
                  placeholder="Last name at birth"
                  className={
                    formErrors.siblings?.[index]?.originalLastName
                      ? "border-red-300"
                      : ""
                  }
                />
                {formErrors.siblings?.[index]?.originalLastName && (
                  <p className="text-sm text-red-600">
                    {formErrors.siblings[index]?.originalLastName?.message}
                  </p>
                )}
              </div>

              {/* Name Changes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Name Change History
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendNameChange({
                        previousName: "",
                        dateOfChange: "",
                        reasonForChange: "MARRIAGE",
                      })
                    }
                    className="border-blue-300 text-xs text-blue-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Name Change
                  </Button>
                </div>

                {nameChangeFields.map((nameField, nameIndex) => (
                  <div
                    key={nameField.id}
                    className="space-y-3 rounded-lg border border-sage-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sage-700">
                        Name Change {nameIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNameChange(nameIndex)}
                        className="h-6 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`siblings.${index}.nameChangeHistory.${nameIndex}.previousName`}
                        className="text-xs"
                      >
                        Previous Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id={`siblings.${index}.nameChangeHistory.${nameIndex}.previousName`}
                        {...form.register(
                          `siblings.${index}.nameChangeHistory.${nameIndex}.previousName`
                        )}
                        placeholder="Full name before change"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`siblings.${index}.nameChangeHistory.${nameIndex}.dateOfChange`}
                        className="text-xs"
                      >
                        Date of Change <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id={`siblings.${index}.nameChangeHistory.${nameIndex}.dateOfChange`}
                        {...form.register(
                          `siblings.${index}.nameChangeHistory.${nameIndex}.dateOfChange`
                        )}
                        type="date"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`siblings.${index}.nameChangeHistory.${nameIndex}.reasonForChange`}
                        className="text-xs"
                      >
                        Reason <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={form.watch(
                          `siblings.${index}.nameChangeHistory.${nameIndex}.reasonForChange`
                        )}
                        onValueChange={(value) =>
                          form.setValue(
                            `siblings.${index}.nameChangeHistory.${nameIndex}.reasonForChange`,
                            value as any
                          )
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARRIAGE">Marriage</SelectItem>
                          <SelectItem value="DIVORCE">Divorce</SelectItem>
                          <SelectItem value="LEGAL_NAME_CHANGE">
                            Legal Name Change
                          </SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.watch(
                      `siblings.${index}.nameChangeHistory.${nameIndex}.reasonForChange`
                    ) === "OTHER" && (
                      <div className="space-y-2">
                        <Label
                          htmlFor={`siblings.${index}.nameChangeHistory.${nameIndex}.otherReason`}
                          className="text-xs"
                        >
                          Please Specify <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id={`siblings.${index}.nameChangeHistory.${nameIndex}.otherReason`}
                          {...form.register(
                            `siblings.${index}.nameChangeHistory.${nameIndex}.otherReason`
                          )}
                          placeholder="Reason for name change"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {nameChangeFields.length === 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-800">
                      Click "Add Name Change" to record each name change
                      chronologically
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Is Deceased */}
        <div className="space-y-3 border-t border-sage-200 pt-4">
          <Label className="text-base font-semibold">
            Is this sibling deceased? <span className="text-red-600">*</span>
          </Label>
          <RadioGroup
            value={form.watch(`siblings.${index}.isDeceased`)}
            onValueChange={(value) =>
              form.setValue(
                `siblings.${index}.isDeceased`,
                value as "YES" | "NO"
              )
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="YES"
                id={`sibling-${index}-deceased-yes`}
              />
              <Label
                htmlFor={`sibling-${index}-deceased-yes`}
                className="cursor-pointer font-normal"
              >
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NO" id={`sibling-${index}-deceased-no`} />
              <Label
                htmlFor={`sibling-${index}-deceased-no`}
                className="cursor-pointer font-normal"
              >
                No
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Deceased Information */}
        {watchIsDeceased === "YES" && (
          <div className="space-y-4 border-t border-sage-200 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`siblings.${index}.dateOfDeath`}>
                Date of Death <span className="text-red-600">*</span>
              </Label>
              <Input
                id={`siblings.${index}.dateOfDeath`}
                {...form.register(`siblings.${index}.dateOfDeath`)}
                type="date"
                className={
                  formErrors.siblings?.[index]?.dateOfDeath
                    ? "border-red-300"
                    : ""
                }
              />
              {formErrors.siblings?.[index]?.dateOfDeath && (
                <p className="text-sm text-red-600">
                  {formErrors.siblings[index]?.dateOfDeath?.message}
                </p>
              )}
            </div>

            {/* City and State of Death */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`siblings.${index}.cityOfDeath`}>
                  City of Death <span className="text-red-600">*</span>
                </Label>
                <Input
                  id={`siblings.${index}.cityOfDeath`}
                  {...form.register(`siblings.${index}.cityOfDeath`)}
                  placeholder="City"
                  className={
                    formErrors.siblings?.[index]?.cityOfDeath
                      ? "border-red-300"
                      : ""
                  }
                />
                {formErrors.siblings?.[index]?.cityOfDeath && (
                  <p className="text-sm text-red-600">
                    {formErrors.siblings[index]?.cityOfDeath?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`siblings.${index}.stateOfDeath`}>
                  State of Death <span className="text-red-600">*</span>
                </Label>
                <Input
                  id={`siblings.${index}.stateOfDeath`}
                  {...form.register(`siblings.${index}.stateOfDeath`)}
                  placeholder="State"
                  className={
                    formErrors.siblings?.[index]?.stateOfDeath
                      ? "border-red-300"
                      : ""
                  }
                />
                {formErrors.siblings?.[index]?.stateOfDeath && (
                  <p className="text-sm text-red-600">
                    {formErrors.siblings[index]?.stateOfDeath?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Death Certificate Status <span className="text-red-600">*</span>
              </Label>
              <Select
                value={form.watch(`siblings.${index}.hasDeathCertificate`)}
                onValueChange={(value) =>
                  form.setValue(
                    `siblings.${index}.hasDeathCertificate`,
                    value as any
                  )
                }
              >
                <SelectTrigger
                  className={
                    formErrors.siblings?.[index]?.hasDeathCertificate
                      ? "border-red-300"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">
                    I have the death certificate
                  </SelectItem>
                  <SelectItem value="WILL_OBTAIN">
                    I will obtain the death certificate
                  </SelectItem>
                  <SelectItem value="NO">
                    I cannot obtain a death certificate
                  </SelectItem>
                </SelectContent>
              </Select>
              {formErrors.siblings?.[index]?.hasDeathCertificate && (
                <p className="text-sm text-red-600">
                  {formErrors.siblings[index]?.hasDeathCertificate?.message}
                </p>
              )}
            </div>

            {/* Upload Death Certificate */}
            {form.watch(`siblings.${index}.hasDeathCertificate`) === "YES" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Upload className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-semibold text-blue-900">
                      Upload Death Certificate
                    </p>
                    <p className="mb-3 text-sm text-blue-800">
                      Please upload a copy of the death certificate for{" "}
                      {form.watch(`siblings.${index}.name`) || "this sibling"}.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    {form.watch(
                      `siblings.${index}.deathCertificateFileKey`
                    ) && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Death certificate uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Living Sibling Contact Information */}
        {watchIsDeceased === "NO" && (
          <div className="space-y-4 border-t border-sage-200 pt-4">
            <div className="space-y-2">
              <Label htmlFor={`siblings.${index}.currentAddress`}>
                Current Address <span className="text-red-600">*</span>
              </Label>
              <Input
                id={`siblings.${index}.currentAddress`}
                {...form.register(`siblings.${index}.currentAddress`)}
                placeholder="Street, City, State, ZIP"
                className={
                  formErrors.siblings?.[index]?.currentAddress
                    ? "border-red-300"
                    : ""
                }
              />
              {formErrors.siblings?.[index]?.currentAddress && (
                <p className="text-sm text-red-600">
                  {formErrors.siblings[index]?.currentAddress?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`siblings.${index}.phoneNumber`}>
                Phone Number <span className="text-red-600">*</span>
              </Label>
              <Input
                id={`siblings.${index}.phoneNumber`}
                {...form.register(`siblings.${index}.phoneNumber`)}
                placeholder="(XXX) XXX-XXXX"
                className={
                  formErrors.siblings?.[index]?.phoneNumber
                    ? "border-red-300"
                    : ""
                }
              />
              {formErrors.siblings?.[index]?.phoneNumber && (
                <p className="text-sm text-red-600">
                  {formErrors.siblings[index]?.phoneNumber?.message}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
