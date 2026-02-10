"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part4SelfFiler } from "@/lib/reca/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Info,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Validation schema for marriage name changes - informational only
const marriageNameChangeSchema = z.object({
  marriageNumber: z.number().min(1),
  previousName: z.string().optional(),
  marriedName: z.string().optional(),
  marriageDate: z.string().optional(),
});

// Main form validation schema - NO BLOCKING REQUIREMENTS
const part4Schema = z.object({
  hasNameChanges: z.boolean(),
  numberOfMarriages: z.number().optional(),
  marriageNameChanges: z.array(marriageNameChangeSchema).optional(),
  specialCircumstances: z.string().optional(),
  documentsIdentified: z
    .object({
      birthCertificateNeeded: z.boolean(),
      marriageCertificatesNeeded: z.boolean(),
      marriageCertificatesCount: z.number(),
    })
    .optional(),
});

type Part4FormData = z.infer<typeof part4Schema>;

interface Part4FormProps {
  initialData?: Partial<Part4SelfFiler>;
  onSubmit: (data: Part4SelfFiler) => void;
}

export default function Part4Form({ initialData, onSubmit }: Part4FormProps) {
  const form = useForm<Part4FormData>({
    resolver: zodResolver(part4Schema),
    defaultValues: {
      hasNameChanges: initialData?.hasNameChanges ?? false,
      numberOfMarriages: initialData?.numberOfMarriages ?? 0,
      marriageNameChanges: initialData?.marriageNameChanges ?? [],
      specialCircumstances: initialData?.specialCircumstances ?? "",
      documentsIdentified: initialData?.documentsIdentified ?? {
        birthCertificateNeeded: true, // Always needed for self-filers
        marriageCertificatesNeeded: false,
        marriageCertificatesCount: 0,
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "marriageNameChanges",
  });

  const hasNameChanges = form.watch("hasNameChanges");
  const numberOfMarriages = form.watch("numberOfMarriages") ?? 0;

  // Track marriage entries when number changes
  useEffect(() => {
    if (hasNameChanges && numberOfMarriages > 0) {
      const currentCount = fields.length;
      if (numberOfMarriages > currentCount) {
        // Add new entries
        for (let i = currentCount; i < numberOfMarriages; i++) {
          append({
            marriageNumber: i + 1,
            previousName: "",
            marriedName: "",
            marriageDate: "",
          });
        }
      } else if (numberOfMarriages < currentCount) {
        // Remove extra entries
        for (let i = currentCount - 1; i >= numberOfMarriages; i--) {
          remove(i);
        }
      }

      // Update document tracking info (non-blocking)
      form.setValue("documentsIdentified.marriageCertificatesNeeded", true);
      form.setValue(
        "documentsIdentified.marriageCertificatesCount",
        numberOfMarriages
      );
    } else {
      form.setValue("documentsIdentified.marriageCertificatesNeeded", false);
      form.setValue("documentsIdentified.marriageCertificatesCount", 0);
    }
  }, [numberOfMarriages, hasNameChanges, fields.length, append, remove, form]);

  const handleSubmit = useCallback(
    async (data: Part4FormData) => {
      // Save whatever information they've provided
      // No validation blocks - they can continue regardless
      await onSubmit(data as Part4SelfFiler);
      return true;
    },
    [onSubmit]
  );

  // Expose form submission to FormWizard
  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handleSubmit(data);
            resolve(true); // Always allow progression
          },
          async (errors) => {
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
      {/* Info Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="text-sm text-sage-700">
              <p className="mb-1 font-semibold">
                Part 4: Self-Filer Information
              </p>
              <p>
                Tell us about any name changes so we can identify which
                documents you'll need. You can complete this form even if you
                don't have all documents ready yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name Changes Information Gathering */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Name Change History</CardTitle>
          <CardDescription className="text-sage-600">
            This helps us determine which documents you'll need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Changes Question */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="name-changes"
                checked={hasNameChanges}
                onCheckedChange={(checked) => {
                  form.setValue("hasNameChanges", !!checked);
                  if (!checked) {
                    form.setValue("numberOfMarriages", 0);
                    form.setValue("marriageNameChanges", []);
                  }
                }}
              />
              <Label htmlFor="name-changes" className="cursor-pointer text-sm">
                I have changed my name due to marriage, divorce, or other
                reasons
              </Label>
            </div>

            {hasNameChanges && (
              <div className="ml-6 space-y-4 rounded-lg border border-sage-200 bg-sage-50 p-4">
                <div>
                  <Label htmlFor="num-marriages">
                    How many times have you been married?
                  </Label>
                  <Input
                    id="num-marriages"
                    type="number"
                    min="0"
                    className="mt-1 w-24"
                    {...form.register("numberOfMarriages", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="mt-1 text-xs text-sage-600">
                    This helps us identify how many marriage certificates you'll
                    need
                  </p>
                </div>

                {numberOfMarriages > 0 && (
                  <>
                    {/* Marriage Details - Optional */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sage-900">
                          Marriage Details
                        </h4>
                        <span className="text-xs text-sage-600">
                          (Optional)
                        </span>
                      </div>
                      <p className="text-sm text-sage-700">
                        Providing details helps us give you more specific
                        guidance, but you can skip this if you don't have the
                        information handy.
                      </p>

                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="space-y-3 rounded-lg border border-sage-300 bg-white p-4"
                        >
                          <h5 className="font-medium text-sage-900">
                            Marriage #{index + 1}
                          </h5>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <Label htmlFor={`previous-name-${index}`}>
                                Name Before Marriage (Optional)
                              </Label>
                              <Input
                                id={`previous-name-${index}`}
                                {...form.register(
                                  `marriageNameChanges.${index}.previousName`
                                )}
                                placeholder="e.g., Jane Smith"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`married-name-${index}`}>
                                Name After Marriage (Optional)
                              </Label>
                              <Input
                                id={`married-name-${index}`}
                                {...form.register(
                                  `marriageNameChanges.${index}.marriedName`
                                )}
                                placeholder="e.g., Jane Johnson"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`marriage-date-${index}`}>
                                Marriage Date (Optional)
                              </Label>
                              <Input
                                id={`marriage-date-${index}`}
                                type="date"
                                {...form.register(
                                  `marriageNameChanges.${index}.marriageDate`
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Special Circumstances */}
          <div>
            <Label htmlFor="circumstances">
              Special Circumstances or Notes (Optional)
            </Label>
            <Textarea
              id="circumstances"
              {...form.register("specialCircumstances")}
              placeholder="Any special circumstances about your name changes or documents we should know about..."
              className="mt-1"
              rows={3}
            />
            <p className="mt-1 text-xs text-sage-600">
              For example: name changed through court order, documents from
              another country, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Requirements Preview - Non-Blocking */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <ClipboardList className="h-5 w-5" />
            Documents You'll Need
          </CardTitle>
          <CardDescription className="text-blue-700">
            Based on your information, you'll need these documents for your
            application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Always needed */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Birth Certificate</p>
                <p className="text-sm text-blue-700">
                  Original or certified copy (required for all self-filers)
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => {
                  // This would open help modal/drawer
                  console.log("Help getting birth certificate");
                }}
              >
                <HelpCircle className="mr-1 h-4 w-4" />
                Help
              </Button>
            </div>

            {/* Conditionally needed */}
            {hasNameChanges && numberOfMarriages > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3">
                <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    Marriage Certificate{numberOfMarriages > 1 ? "s" : ""} (
                    {numberOfMarriages})
                  </p>
                  <p className="text-sm text-blue-700">
                    Certified {numberOfMarriages > 1 ? "copies" : "copy"} to
                    document name changes
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    // This would open help modal/drawer
                    console.log("Help getting marriage certificates");
                  }}
                >
                  <HelpCircle className="mr-1 h-4 w-4" />
                  Help
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="mb-1 font-medium">
                  You can continue without these documents
                </p>
                <p className="text-xs">
                  We'll help you track and obtain any missing documents. You'll
                  need them before final submission to DOJ, but not to complete
                  this form.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Notice */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-900">
              <p className="mb-1 font-semibold">Continue to Next Section</p>
              <p>
                You can proceed to the next section at any time. We'll track
                your document requirements separately and help you obtain any
                missing documents before final submission.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
