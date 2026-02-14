"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part5SurvivingSpouse } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/reca/FieldLabel";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Info,
  Heart,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

// Previous spouse record schema - all fields optional for non-blocking
const previousSpouseSchema = z.object({
  spouseName: z.string().optional(),
  marriageStart: z.string().optional(),
  marriageEnd: z.string().optional(),
  endReason: z.enum(["DIVORCE", "DEATH"]).optional(),
});

// Main form schema - NO BLOCKING REQUIREMENTS
// Following "Guide, Don't Gate" philosophy
const part5Schema = z.object({
  // Basic information
  claimantDeceased: z.enum(["YES", "NO"]).optional(),
  dateOfDeath: z.string().optional(),
  marriageDate: z.string().optional(),
  marriedOneYear: z.enum(["YES", "NO"]).optional(),

  // Name information
  nameAtMarriage: z.string().optional(),
  currentNameIfDifferent: z.string().optional(),

  // Previous marriages - claimant (the person who became ill)
  claimantPreviousMarriages: z.enum(["YES", "NO"]).optional(),
  claimantPreviousSpouses: z.array(previousSpouseSchema).optional(),

  // Previous marriages - filer (you, the surviving spouse)
  filerOtherMarriages: z.enum(["YES", "NO"]).optional(),
  filerOtherSpouses: z.array(previousSpouseSchema).optional(),

  // Special circumstances
  specialCircumstances: z.string().optional(),

  // Document awareness (non-blocking)
  documentsIdentified: z
    .object({
      deathCertificateNeeded: z.boolean(),
      marriageCertificateNeeded: z.boolean(),
      divorcePapersNeeded: z.boolean(),
      previousMarriageCertsNeeded: z.number(),
    })
    .optional(),
});

type Part5FormData = z.infer<typeof part5Schema>;

interface Part5FormProps {
  initialData?: Partial<Part5SurvivingSpouse>;
  onSubmit: (data: Part5SurvivingSpouse) => void;
  part2Data?: any; // Data from Part 2 containing deceased person's info
}

export default function Part5Form({
  initialData,
  onSubmit,
  part2Data,
}: Part5FormProps) {
  // Auto-populate from Part 2 data if available
  const claimantDeceasedFromPart2 = part2Data?.dod ? "YES" : undefined;
  const dateOfDeathFromPart2 = part2Data?.dod || "";

  const form = useForm<Part5FormData>({
    resolver: zodResolver(part5Schema),
    defaultValues: {
      claimantDeceased:
        initialData?.claimantDeceased || claimantDeceasedFromPart2,
      dateOfDeath: initialData?.dateOfDeath || dateOfDeathFromPart2,
      marriageDate: initialData?.marriageDate || "",
      marriedOneYear: initialData?.marriedOneYear || undefined,
      nameAtMarriage: initialData?.nameAtMarriage || "",
      currentNameIfDifferent: initialData?.currentNameIfDifferent || "",
      claimantPreviousMarriages:
        initialData?.claimantPreviousMarriages || undefined,
      claimantPreviousSpouses: initialData?.claimantPreviousSpouses || [],
      filerOtherMarriages: initialData?.filerOtherMarriages || undefined,
      filerOtherSpouses: initialData?.filerOtherSpouses || [],
      specialCircumstances: initialData?.specialCircumstances || "",
      documentsIdentified: initialData?.documentsIdentified || {
        deathCertificateNeeded: true,
        marriageCertificateNeeded: true,
        divorcePapersNeeded: false,
        previousMarriageCertsNeeded: 0,
      },
    },
  });

  // Field arrays for previous spouses
  const {
    fields: claimantSpouseFields,
    append: appendClaimantSpouse,
    remove: removeClaimantSpouse,
  } = useFieldArray({
    control: form.control,
    name: "claimantPreviousSpouses",
  });

  const {
    fields: filerSpouseFields,
    append: appendFilerSpouse,
    remove: removeFilerSpouse,
  } = useFieldArray({
    control: form.control,
    name: "filerOtherSpouses",
  });

  // Watch key fields for conditional rendering
  const watchClaimantDeceased = form.watch("claimantDeceased");
  const watchMarriedOneYear = form.watch("marriedOneYear");
  const watchClaimantPreviousMarriages = form.watch(
    "claimantPreviousMarriages"
  );
  const watchFilerOtherMarriages = form.watch("filerOtherMarriages");

  // Update document tracking based on form state
  useEffect(() => {
    const claimantHasPrevious = watchClaimantPreviousMarriages === "YES";
    const filerHasPrevious = watchFilerOtherMarriages === "YES";
    const totalPreviousMarriages =
      (claimantHasPrevious ? claimantSpouseFields.length : 0) +
      (filerHasPrevious ? filerSpouseFields.length : 0);
    const anyDivorce =
      form
        .getValues("claimantPreviousSpouses")
        ?.some((s) => s.endReason === "DIVORCE") ||
      form
        .getValues("filerOtherSpouses")
        ?.some((s) => s.endReason === "DIVORCE");

    form.setValue("documentsIdentified", {
      deathCertificateNeeded: true, // Always needed for surviving spouse claims
      marriageCertificateNeeded: true, // Always needed
      divorcePapersNeeded: !!anyDivorce,
      previousMarriageCertsNeeded: totalPreviousMarriages,
    });
  }, [
    watchClaimantPreviousMarriages,
    watchFilerOtherMarriages,
    claimantSpouseFields.length,
    filerSpouseFields.length,
    form,
  ]);

  const handleSubmit = useCallback(
    async (data: Part5FormData) => {
      // Save whatever information they've provided - non-blocking
      await onSubmit(data as Part5SurvivingSpouse);
      return true;
    },
    [onSubmit]
  );

  // Expose form submission to FormWizard - non-blocking pattern
  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handleSubmit(data);
            resolve(true); // Always allow progression
          },
          async () => {
            // Even with errors, save what we have and allow progression
            const formData = form.getValues();
            await handleSubmit(formData);
            resolve(true);
          }
        )();
      });
    };

    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handleSubmit]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Header Info Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="text-sm text-sage-700">
              <p className="mb-1 font-semibold">
                Part 5: Surviving Spouse Information
              </p>
              <p>
                Tell us about your marriage to the person who became ill. You
                can complete this form even if you don&apos;t have all details
                yet — fill in what you know and come back later for the rest.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Claimant Death Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Heart className="h-5 w-5 text-terracotta-500" />
            About the Person Who Became Ill
          </CardTitle>
          <CardDescription className="text-sage-600">
            Information about your spouse who was exposed to radiation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Claimant Deceased */}
          <div className="space-y-3">
            <FieldLabel
              importance="required"
              className="text-sm font-medium text-sage-800"
            >
              Has your spouse (the person who became ill) passed away?
            </FieldLabel>
            <RadioGroup
              value={watchClaimantDeceased || ""}
              onValueChange={(value) =>
                form.setValue("claimantDeceased", value as "YES" | "NO", {
                  shouldValidate: true,
                })
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="deceased-yes" />
                <Label htmlFor="deceased-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="deceased-no" />
                <Label htmlFor="deceased-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date of Death - conditional */}
          {watchClaimantDeceased === "YES" && (
            <div className="space-y-2">
              <FieldLabel
                htmlFor="dateOfDeath"
                importance="required"
                className="text-sm font-medium text-sage-800"
              >
                Date of Death
              </FieldLabel>
              <Input
                id="dateOfDeath"
                type="date"
                {...form.register("dateOfDeath")}
                className="max-w-xs"
              />
              {!form.watch("dateOfDeath") && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  This will be needed for your final submission
                </p>
              )}
            </div>
          )}

          {watchClaimantDeceased === "NO" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  If the person who became ill is still living, they may be
                  eligible to file for themselves. You can still continue
                  filling out this section.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Marriage Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Marriage Details
          </CardTitle>
          <CardDescription className="text-sage-600">
            Information about your marriage to the person who became ill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Marriage Date */}
          <div className="space-y-2">
            <FieldLabel
              htmlFor="marriageDate"
              importance="required"
              className="text-sm font-medium text-sage-800"
            >
              Date of Marriage
            </FieldLabel>
            <Input
              id="marriageDate"
              type="date"
              {...form.register("marriageDate")}
              className="max-w-xs"
            />
            {!form.watch("marriageDate") && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                This will be needed for your final submission
              </p>
            )}
          </div>

          {/* Married One Year */}
          <div className="space-y-3">
            <FieldLabel
              importance="required"
              className="text-sm font-medium text-sage-800"
            >
              Were you married for at least one year before the death or onset
              of illness?
            </FieldLabel>
            <RadioGroup
              value={watchMarriedOneYear || ""}
              onValueChange={(value) =>
                form.setValue("marriedOneYear", value as "YES" | "NO", {
                  shouldValidate: true,
                })
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="married-year-yes" />
                <Label htmlFor="married-year-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="married-year-no" />
                <Label htmlFor="married-year-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
            {watchMarriedOneYear === "NO" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Eligibility Note
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      RECA generally requires that the surviving spouse was
                      married for at least one year. You can still continue
                      filling out this section — there may be special
                      circumstances that apply to your situation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Name at Marriage */}
          <div className="space-y-2">
            <FieldLabel
              htmlFor="nameAtMarriage"
              importance="recommended"
              className="text-sm font-medium text-sage-800"
            >
              Your Name at the Time of Marriage
            </FieldLabel>
            <Input
              id="nameAtMarriage"
              placeholder="Full legal name at time of marriage"
              {...form.register("nameAtMarriage")}
              className="max-w-md"
            />
          </div>

          {/* Current Name if Different */}
          <div className="space-y-2">
            <FieldLabel
              htmlFor="currentNameIfDifferent"
              importance="optional"
              className="text-sm font-medium text-sage-800"
            >
              Current Name (if different from name at marriage)
            </FieldLabel>
            <Input
              id="currentNameIfDifferent"
              placeholder="Leave blank if your name hasn't changed"
              {...form.register("currentNameIfDifferent")}
              className="max-w-md"
            />
            <p className="text-xs text-sage-500">
              If your name has changed since the marriage, a name change
              document may be needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Claimant's Previous Marriages */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Previous Marriages — Person Who Became Ill
          </CardTitle>
          <CardDescription className="text-sage-600">
            Was the person who became ill previously married to anyone else?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <FieldLabel
              importance="recommended"
              className="text-sm font-medium text-sage-800"
            >
              Did the person who became ill have any previous marriages?
            </FieldLabel>
            <RadioGroup
              value={watchClaimantPreviousMarriages || ""}
              onValueChange={(value) => {
                form.setValue(
                  "claimantPreviousMarriages",
                  value as "YES" | "NO",
                  { shouldValidate: true }
                );
                if (value === "NO") {
                  // Clear previous spouse entries
                  while (claimantSpouseFields.length > 0) {
                    removeClaimantSpouse(0);
                  }
                }
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="claimant-prev-yes" />
                <Label htmlFor="claimant-prev-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="claimant-prev-no" />
                <Label htmlFor="claimant-prev-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Claimant Previous Spouse Entries */}
          {watchClaimantPreviousMarriages === "YES" && (
            <div className="space-y-4">
              {claimantSpouseFields.length === 0 && (
                <div className="rounded-lg border border-dashed border-sage-300 bg-sage-50 p-4 text-center text-sm text-sage-600">
                  No previous marriages added yet. Click below to add one.
                </div>
              )}

              {claimantSpouseFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-xl border border-sage-200 bg-sage-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-sage-800">
                      Previous Spouse {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeClaimantSpouse(index)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Spouse Name
                      </FieldLabel>
                      <Input
                        placeholder="Full legal name"
                        {...form.register(
                          `claimantPreviousSpouses.${index}.spouseName`
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        How Did This Marriage End?
                      </FieldLabel>
                      <Select
                        value={
                          form.watch(
                            `claimantPreviousSpouses.${index}.endReason`
                          ) || ""
                        }
                        onValueChange={(value) =>
                          form.setValue(
                            `claimantPreviousSpouses.${index}.endReason`,
                            value as "DIVORCE" | "DEATH"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIVORCE">Divorce</SelectItem>
                          <SelectItem value="DEATH">Death of Spouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Marriage Start Date
                      </FieldLabel>
                      <Input
                        type="date"
                        {...form.register(
                          `claimantPreviousSpouses.${index}.marriageStart`
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Marriage End Date
                      </FieldLabel>
                      <Input
                        type="date"
                        {...form.register(
                          `claimantPreviousSpouses.${index}.marriageEnd`
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendClaimantSpouse({
                    spouseName: "",
                    marriageStart: "",
                    marriageEnd: "",
                    endReason: undefined,
                  })
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Previous Marriage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Filer's Other Marriages */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Your Other Marriages</CardTitle>
          <CardDescription className="text-sage-600">
            Were you previously married to anyone else (besides the person who
            became ill)?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <FieldLabel
              importance="recommended"
              className="text-sm font-medium text-sage-800"
            >
              Do you have any other previous or current marriages?
            </FieldLabel>
            <RadioGroup
              value={watchFilerOtherMarriages || ""}
              onValueChange={(value) => {
                form.setValue("filerOtherMarriages", value as "YES" | "NO", {
                  shouldValidate: true,
                });
                if (value === "NO") {
                  while (filerSpouseFields.length > 0) {
                    removeFilerSpouse(0);
                  }
                }
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="filer-prev-yes" />
                <Label htmlFor="filer-prev-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="filer-prev-no" />
                <Label htmlFor="filer-prev-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filer Previous Spouse Entries */}
          {watchFilerOtherMarriages === "YES" && (
            <div className="space-y-4">
              {filerSpouseFields.length === 0 && (
                <div className="rounded-lg border border-dashed border-sage-300 bg-sage-50 p-4 text-center text-sm text-sage-600">
                  No other marriages added yet. Click below to add one.
                </div>
              )}

              {filerSpouseFields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-xl border border-sage-200 bg-sage-50/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-sage-800">
                      Other Marriage {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilerSpouse(index)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Spouse Name
                      </FieldLabel>
                      <Input
                        placeholder="Full legal name"
                        {...form.register(
                          `filerOtherSpouses.${index}.spouseName`
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        How Did This Marriage End?
                      </FieldLabel>
                      <Select
                        value={
                          form.watch(`filerOtherSpouses.${index}.endReason`) ||
                          ""
                        }
                        onValueChange={(value) =>
                          form.setValue(
                            `filerOtherSpouses.${index}.endReason`,
                            value as "DIVORCE" | "DEATH"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIVORCE">Divorce</SelectItem>
                          <SelectItem value="DEATH">Death of Spouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Marriage Start Date
                      </FieldLabel>
                      <Input
                        type="date"
                        {...form.register(
                          `filerOtherSpouses.${index}.marriageStart`
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel
                        importance="recommended"
                        className="text-xs text-sage-700"
                      >
                        Marriage End Date
                      </FieldLabel>
                      <Input
                        type="date"
                        {...form.register(
                          `filerOtherSpouses.${index}.marriageEnd`
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendFilerSpouse({
                    spouseName: "",
                    marriageStart: "",
                    marriageEnd: "",
                    endReason: undefined,
                  })
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Other Marriage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Special Circumstances */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Special Circumstances</CardTitle>
          <CardDescription className="text-sage-600">
            Any additional information about your situation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FieldLabel
              htmlFor="specialCircumstances"
              importance="optional"
              className="text-sm font-medium text-sage-800"
            >
              Are there any special circumstances regarding your marriage or
              eligibility? (Optional)
            </FieldLabel>
            <Textarea
              id="specialCircumstances"
              placeholder="For example: common-law marriage, marriage occurred outside the U.S., name changes due to reasons other than marriage, etc."
              {...form.register("specialCircumstances")}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-sage-500">
              This is optional. Any additional context can help strengthen your
              claim.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Tracking Summary */}
      <Card className="rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Documents You&apos;ll Need
          </CardTitle>
          <CardDescription className="text-sage-600">
            Based on your answers, here are the documents you&apos;ll need to
            gather. Don&apos;t worry — you can upload these later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Death Certificate */}
            <div className="flex items-start gap-3 rounded-lg border border-sage-200 bg-white p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
              <div>
                <p className="text-sm font-medium text-sage-800">
                  Death Certificate
                </p>
                <p className="text-xs text-sage-600">
                  Certified copy of the death certificate for the person who
                  became ill
                </p>
              </div>
            </div>

            {/* Marriage Certificate */}
            <div className="flex items-start gap-3 rounded-lg border border-sage-200 bg-white p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
              <div>
                <p className="text-sm font-medium text-sage-800">
                  Marriage Certificate
                </p>
                <p className="text-xs text-sage-600">
                  Certified copy of your marriage certificate
                </p>
              </div>
            </div>

            {/* Divorce Papers - conditional */}
            {(watchClaimantPreviousMarriages === "YES" ||
              watchFilerOtherMarriages === "YES") && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Divorce Decrees / Prior Marriage Certificates
                  </p>
                  <p className="text-xs text-amber-700">
                    Since there are previous marriages, you may need divorce
                    decrees or death certificates for prior spouses to show how
                    those marriages ended
                  </p>
                </div>
              </div>
            )}

            {/* Name Change Docs - conditional */}
            {form.watch("currentNameIfDifferent") && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Name Change Documentation
                  </p>
                  <p className="text-xs text-amber-700">
                    Since your name has changed since the marriage, you may need
                    documentation of the name change (marriage certificate,
                    court order, etc.)
                  </p>
                </div>
              </div>
            )}

            {/* Help Resources */}
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Need Help Getting Documents?
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-800">
                    <li>
                      • <strong>Death certificates:</strong> Contact the vital
                      records office in the state where the death occurred
                    </li>
                    <li>
                      • <strong>Marriage certificates:</strong> Contact the
                      county clerk&apos;s office where you were married
                    </li>
                    <li>
                      • <strong>Divorce decrees:</strong> Contact the court
                      where the divorce was finalized
                    </li>
                    <li>
                      • You can upload documents anytime from your portal&apos;s
                      Document Management page
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
