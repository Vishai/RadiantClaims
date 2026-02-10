"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part7OtherRelatives } from "@/lib/reca/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Info,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

// Intermediary relative schema - all optional for non-blocking
const intermediarySchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  isDeceased: z.enum(["YES", "NO"]).optional(),
});

// Main form schema - NO BLOCKING REQUIREMENTS
const part7Schema = z.object({
  relationshipType: z.enum(["PARENT", "GRANDCHILD", "GRANDPARENT"]),

  // Claimant info
  claimantDeceased: z.enum(["YES", "NO"]).optional(),
  dateOfDeath: z.string().optional(),

  // Relationship chain
  claimantFullName: z.string().optional(),
  claimantDateOfBirth: z.string().optional(),
  claimantDateOfDeath: z.string().optional(),

  // Intermediary relatives (to establish relationship chain)
  intermediaryRelatives: z.array(intermediarySchema).optional(),

  // Eligibility
  survivingSpouseExists: z.enum(["YES", "NO", "UNKNOWN"]).optional(),
  survivingChildExists: z.enum(["YES", "NO", "UNKNOWN"]).optional(),

  // Special circumstances
  specialCircumstances: z.string().optional(),

  // Document tracking
  documentsIdentified: z
    .object({
      deathCertificateNeeded: z.boolean(),
      birthCertificatesNeeded: z.number(),
      marriageCertificatesNeeded: z.number(),
      additionalDocumentsNote: z.string(),
    })
    .optional(),
});

type Part7FormData = z.infer<typeof part7Schema>;

interface Part7FormProps {
  initialData?: Partial<Part7OtherRelatives>;
  onSubmit: (data: Part7OtherRelatives) => void;
}

// Relationship-specific labels and guidance
const RELATIONSHIP_CONFIG = {
  PARENT: {
    label: "Surviving Parent",
    claimantLabel: "your child",
    description:
      "You are filing as a parent of the person who became ill from radiation exposure.",
    chainExplanation:
      "You may need to establish that no surviving spouse or surviving children exist with priority over your claim.",
    intermediaryLabel: "Other Family Members",
    intermediaryDescription:
      "Add other family members who help establish the relationship chain (e.g., the other parent if applicable).",
    documentsNote:
      "You will need birth certificates linking you to the person who became ill, plus documentation of any surviving spouse or children.",
  },
  GRANDCHILD: {
    label: "Surviving Grandchild",
    claimantLabel: "your grandparent",
    description:
      "You are filing as a grandchild of the person who became ill from radiation exposure.",
    chainExplanation:
      "You will need to establish the chain of relationship through your parent to the person who became ill, and that no higher-priority relatives exist.",
    intermediaryLabel: "Connecting Relatives",
    intermediaryDescription:
      "Add the parent(s) who connect you to the person who became ill. This establishes the family chain.",
    documentsNote:
      "You will need birth certificates for yourself, your parent, and the person who became ill to establish the chain.",
  },
  GRANDPARENT: {
    label: "Surviving Grandparent",
    claimantLabel: "your grandchild",
    description:
      "You are filing as a grandparent of the person who became ill from radiation exposure.",
    chainExplanation:
      "You will need to establish the chain of relationship through your child to the person who became ill, and that no higher-priority relatives exist.",
    intermediaryLabel: "Connecting Relatives",
    intermediaryDescription:
      "Add the child(ren) who connect you to the person who became ill. This establishes the family chain.",
    documentsNote:
      "You will need birth certificates linking you through your child to the person who became ill.",
  },
};

export default function Part7Form({ initialData, onSubmit }: Part7FormProps) {
  const form = useForm<Part7FormData>({
    resolver: zodResolver(part7Schema),
    defaultValues: {
      relationshipType: initialData?.relationshipType || "PARENT",
      claimantDeceased: initialData?.claimantDeceased || undefined,
      dateOfDeath: initialData?.dateOfDeath || "",
      claimantFullName: initialData?.claimantFullName || "",
      claimantDateOfBirth: initialData?.claimantDateOfBirth || "",
      claimantDateOfDeath: initialData?.claimantDateOfDeath || "",
      intermediaryRelatives: initialData?.intermediaryRelatives || [],
      survivingSpouseExists: initialData?.survivingSpouseExists || undefined,
      survivingChildExists: initialData?.survivingChildExists || undefined,
      specialCircumstances: initialData?.specialCircumstances || "",
      documentsIdentified: initialData?.documentsIdentified || {
        deathCertificateNeeded: true,
        birthCertificatesNeeded: 2,
        marriageCertificatesNeeded: 0,
        additionalDocumentsNote: "",
      },
    },
  });

  const {
    fields: intermediaryFields,
    append: appendIntermediary,
    remove: removeIntermediary,
  } = useFieldArray({
    control: form.control,
    name: "intermediaryRelatives",
  });

  const watchRelationshipType = form.watch("relationshipType");
  const watchClaimantDeceased = form.watch("claimantDeceased");
  const watchSurvivingSpouse = form.watch("survivingSpouseExists");
  const watchSurvivingChild = form.watch("survivingChildExists");

  const config = RELATIONSHIP_CONFIG[watchRelationshipType];

  // Update document tracking
  useEffect(() => {
    const chainLength = intermediaryFields.length;
    // Birth certs needed: 1 for claimant + 1 for each intermediary + 1 for you = 2 + intermediaries
    const birthCertsNeeded = 2 + chainLength;

    let note = config.documentsNote;
    if (watchSurvivingSpouse === "YES") {
      note +=
        " Note: A surviving spouse may have priority. RECA staff will advise.";
    }
    if (watchSurvivingChild === "YES" && watchRelationshipType !== "PARENT") {
      note +=
        " Note: Surviving children may have priority. RECA staff will advise.";
    }

    form.setValue("documentsIdentified", {
      deathCertificateNeeded: watchClaimantDeceased === "YES",
      birthCertificatesNeeded: birthCertsNeeded,
      marriageCertificatesNeeded: 0,
      additionalDocumentsNote: note,
    });
  }, [
    intermediaryFields.length,
    watchClaimantDeceased,
    watchSurvivingSpouse,
    watchSurvivingChild,
    watchRelationshipType,
    config.documentsNote,
    form,
  ]);

  const handleSubmit = useCallback(
    async (data: Part7FormData) => {
      await onSubmit(data as Part7OtherRelatives);
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
            resolve(true);
          },
          async () => {
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
                Part 7: Parents, Grandchildren, or Grandparents
              </p>
              <p>
                This section gathers information about your relationship to the
                person who became ill. Fill in what you know — you can always
                come back and add more details later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Relationship Type */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Users className="h-5 w-5 text-terracotta-500" />
            Your Relationship
          </CardTitle>
          <CardDescription className="text-sage-600">
            How are you related to the person who became ill?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sage-800">
              Select your relationship
            </Label>
            <RadioGroup
              value={watchRelationshipType}
              onValueChange={(value) =>
                form.setValue(
                  "relationshipType",
                  value as "PARENT" | "GRANDCHILD" | "GRANDPARENT",
                  { shouldValidate: true }
                )
              }
              className="grid gap-3"
            >
              <div className="flex items-start space-x-3 rounded-lg border border-sage-200 p-3 transition-colors hover:bg-sage-50">
                <RadioGroupItem
                  value="PARENT"
                  id="rel-parent"
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="rel-parent"
                    className="cursor-pointer font-medium"
                  >
                    Surviving Parent
                  </Label>
                  <p className="mt-0.5 text-xs text-sage-500">
                    I am the parent of the person who became ill
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border border-sage-200 p-3 transition-colors hover:bg-sage-50">
                <RadioGroupItem
                  value="GRANDCHILD"
                  id="rel-grandchild"
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="rel-grandchild"
                    className="cursor-pointer font-medium"
                  >
                    Surviving Grandchild
                  </Label>
                  <p className="mt-0.5 text-xs text-sage-500">
                    I am the grandchild of the person who became ill
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border border-sage-200 p-3 transition-colors hover:bg-sage-50">
                <RadioGroupItem
                  value="GRANDPARENT"
                  id="rel-grandparent"
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="rel-grandparent"
                    className="cursor-pointer font-medium"
                  >
                    Surviving Grandparent
                  </Label>
                  <p className="mt-0.5 text-xs text-sage-500">
                    I am the grandparent of the person who became ill
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Relationship-specific guidance */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {config.label}
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  {config.description}
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  {config.chainExplanation}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Person Who Became Ill */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            About the Person Who Became Ill
          </CardTitle>
          <CardDescription className="text-sage-600">
            Information about {config.claimantLabel} who was exposed to
            radiation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="claimantFullName"
                className="text-sm font-medium text-sage-800"
              >
                Full Legal Name
              </Label>
              <Input
                id="claimantFullName"
                placeholder="Full legal name"
                {...form.register("claimantFullName")}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="claimantDateOfBirth"
                className="text-sm font-medium text-sage-800"
              >
                Date of Birth
              </Label>
              <Input
                id="claimantDateOfBirth"
                type="date"
                {...form.register("claimantDateOfBirth")}
              />
            </div>
          </div>

          {/* Deceased */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sage-800">
              Has {config.claimantLabel} passed away?
            </Label>
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
                <RadioGroupItem value="YES" id="claimant-deceased-yes" />
                <Label
                  htmlFor="claimant-deceased-yes"
                  className="cursor-pointer"
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="claimant-deceased-no" />
                <Label
                  htmlFor="claimant-deceased-no"
                  className="cursor-pointer"
                >
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {watchClaimantDeceased === "YES" && (
            <div className="space-y-2">
              <Label
                htmlFor="claimantDateOfDeath"
                className="text-sm font-medium text-sage-800"
              >
                Date of Death
              </Label>
              <Input
                id="claimantDateOfDeath"
                type="date"
                {...form.register("claimantDateOfDeath")}
                className="max-w-xs"
              />
              {!form.watch("claimantDateOfDeath") && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  This will be needed for your final submission
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Eligibility - Priority Relatives */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Other Eligible Relatives
          </CardTitle>
          <CardDescription className="text-sage-600">
            RECA has a priority order for who can file. Help us understand your
            situation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Surviving Spouse */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-sage-800">
              Does {config.claimantLabel} have a surviving spouse?
            </Label>
            <RadioGroup
              value={watchSurvivingSpouse || ""}
              onValueChange={(value) =>
                form.setValue(
                  "survivingSpouseExists",
                  value as "YES" | "NO" | "UNKNOWN",
                  { shouldValidate: true }
                )
              }
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="YES" id="spouse-yes" />
                <Label htmlFor="spouse-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NO" id="spouse-no" />
                <Label htmlFor="spouse-no" className="cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UNKNOWN" id="spouse-unknown" />
                <Label htmlFor="spouse-unknown" className="cursor-pointer">
                  Not Sure
                </Label>
              </div>
            </RadioGroup>
            {watchSurvivingSpouse === "YES" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Eligibility Note
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      A surviving spouse who was married for at least one year
                      generally has priority for filing. You can still continue
                      with this application — RECA staff will help determine
                      eligibility.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Surviving Children (shown for grandparents and parents) */}
          {watchRelationshipType !== "PARENT" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-sage-800">
                Does {config.claimantLabel} have any surviving children?
              </Label>
              <RadioGroup
                value={watchSurvivingChild || ""}
                onValueChange={(value) =>
                  form.setValue(
                    "survivingChildExists",
                    value as "YES" | "NO" | "UNKNOWN",
                    { shouldValidate: true }
                  )
                }
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="YES" id="child-yes" />
                  <Label htmlFor="child-yes" className="cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NO" id="child-no" />
                  <Label htmlFor="child-no" className="cursor-pointer">
                    No
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UNKNOWN" id="child-unknown" />
                  <Label htmlFor="child-unknown" className="cursor-pointer">
                    Not Sure
                  </Label>
                </div>
              </RadioGroup>
              {watchSurvivingChild === "YES" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        Eligibility Note
                      </p>
                      <p className="mt-1 text-sm text-amber-800">
                        Surviving children generally have priority over{" "}
                        {watchRelationshipType === "GRANDCHILD"
                          ? "grandchildren"
                          : "grandparents"}
                        . You can still continue — RECA staff will help
                        determine eligibility.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Relationship Chain */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            {config.intermediaryLabel}
          </CardTitle>
          <CardDescription className="text-sage-600">
            {config.intermediaryDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {intermediaryFields.length === 0 && (
            <div className="rounded-lg border border-dashed border-sage-300 bg-sage-50 p-4 text-center text-sm text-sage-600">
              {watchRelationshipType === "PARENT"
                ? "If there are other relevant family members, add them here. Otherwise you can skip this section."
                : "Add the family member(s) who connect you to the person who became ill."}
            </div>
          )}

          {intermediaryFields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-4 rounded-xl border border-sage-200 bg-sage-50/50 p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-sage-800">
                  Family Member {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIntermediary(index)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-sage-700">Full Name</Label>
                  <Input
                    placeholder="Full legal name"
                    {...form.register(`intermediaryRelatives.${index}.name`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-sage-700">
                    Relationship to Person Who Became Ill
                  </Label>
                  <Input
                    placeholder="e.g., Son, Daughter, Parent"
                    {...form.register(
                      `intermediaryRelatives.${index}.relationship`
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-sage-700">Date of Birth</Label>
                  <Input
                    type="date"
                    {...form.register(
                      `intermediaryRelatives.${index}.dateOfBirth`
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-sage-700">
                    Is this person deceased?
                  </Label>
                  <RadioGroup
                    value={
                      form.watch(`intermediaryRelatives.${index}.isDeceased`) ||
                      ""
                    }
                    onValueChange={(value) =>
                      form.setValue(
                        `intermediaryRelatives.${index}.isDeceased`,
                        value as "YES" | "NO"
                      )
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="YES"
                        id={`inter-deceased-yes-${index}`}
                      />
                      <Label
                        htmlFor={`inter-deceased-yes-${index}`}
                        className="cursor-pointer text-xs"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="NO"
                        id={`inter-deceased-no-${index}`}
                      />
                      <Label
                        htmlFor={`inter-deceased-no-${index}`}
                        className="cursor-pointer text-xs"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {form.watch(`intermediaryRelatives.${index}.isDeceased`) ===
                "YES" && (
                <div className="space-y-2">
                  <Label className="text-xs text-sage-700">Date of Death</Label>
                  <Input
                    type="date"
                    {...form.register(
                      `intermediaryRelatives.${index}.dateOfDeath`
                    )}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendIntermediary({
                name: "",
                relationship: "",
                dateOfBirth: "",
                dateOfDeath: "",
                isDeceased: undefined,
              })
            }
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Family Member
          </Button>
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
            <Label
              htmlFor="specialCircumstances"
              className="text-sm font-medium text-sage-800"
            >
              Are there any special circumstances? (Optional)
            </Label>
            <Textarea
              id="specialCircumstances"
              placeholder="For example: adopted family members, complex family relationships, missing documents, etc."
              {...form.register("specialCircumstances")}
              rows={4}
              className="resize-none"
            />
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
            Based on your answers, here are the documents to gather. You can
            upload these later from your Document Management page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Death Certificate */}
            {watchClaimantDeceased === "YES" && (
              <div className="flex items-start gap-3 rounded-lg border border-sage-200 bg-white p-3">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
                <div>
                  <p className="text-sm font-medium text-sage-800">
                    Death Certificate
                  </p>
                  <p className="text-xs text-sage-600">
                    Certified copy for the person who became ill
                  </p>
                </div>
              </div>
            )}

            {/* Birth Certificates */}
            <div className="flex items-start gap-3 rounded-lg border border-sage-200 bg-white p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
              <div>
                <p className="text-sm font-medium text-sage-800">
                  Birth Certificate(s)
                </p>
                <p className="text-xs text-sage-600">
                  {watchRelationshipType === "PARENT"
                    ? "Birth certificate of the person who became ill (to show you as parent)"
                    : watchRelationshipType === "GRANDCHILD"
                      ? "Your birth certificate, your parent's birth certificate, and the person who became ill's birth certificate"
                      : "Your child's birth certificate and the person who became ill's birth certificate"}
                </p>
              </div>
            </div>

            {/* Intermediary death certs */}
            {intermediaryFields.some(
              (_, i) =>
                form.watch(`intermediaryRelatives.${i}.isDeceased`) === "YES"
            ) && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Additional Death Certificate(s)
                  </p>
                  <p className="text-xs text-amber-700">
                    Death certificates for deceased family members in the
                    relationship chain
                  </p>
                </div>
              </div>
            )}

            {/* RECA Staff Note */}
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Additional Documentation May Be Required
                  </p>
                  <p className="mt-1 text-xs text-yellow-800">
                    For {config.label.toLowerCase()} claims, RECA staff will
                    review your application and may request additional documents
                    to establish eligibility and the relationship chain. We will
                    help you through this process.
                  </p>
                </div>
              </div>
            </div>

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
                      • <strong>Birth certificates:</strong> Contact the vital
                      records office in the state of birth
                    </li>
                    <li>
                      • <strong>Death certificates:</strong> Contact the vital
                      records office in the state where death occurred
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
