"use client";

import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part3Relationship, RelationshipType } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info, Users, UserCircle, Heart, Baby, User } from "lucide-react";

const part3Schema = z.object({
  relationship: z.enum(
    ["Self", "Spouse", "Child", "Parent", "Grandchild", "Grandparent"],
    {
      required_error: "Please select your relationship",
    }
  ),
});

type Part3FormData = z.infer<typeof part3Schema>;

interface Part3FormProps {
  initialData?: Partial<Part3Relationship>;
  onSubmit: (data: Part3Relationship) => void;
  filingForSelf?: boolean; // From Part 1
}

const relationshipOptions: Array<{
  value: RelationshipType;
  icon: any;
  label: string;
  description: string;
  requirements: string[];
}> = [
  {
    value: "Self",
    icon: UserCircle,
    label: "I became ill (Self-Filer)",
    description:
      "You are filing for yourself because you were diagnosed with a compensable cancer",
    requirements: [
      "Birth certificate",
      "Proof of presence in affected area",
      "Medical records showing diagnosis",
    ],
  },
  {
    value: "Spouse",
    icon: Heart,
    label: "Surviving Spouse",
    description:
      "You are the surviving spouse of someone who was diagnosed with a compensable cancer",
    requirements: [
      "Death certificate of spouse",
      "Marriage certificate(s)",
      "Must have been married 1+ year before death",
    ],
  },
  {
    value: "Child",
    icon: Baby,
    label: "Surviving Child",
    description:
      "You are the child (natural, adopted, or step-child) of someone who was diagnosed",
    requirements: [
      "Death certificate of parent",
      "Birth/adoption certificate",
      "Information about all siblings",
    ],
  },
  {
    value: "Parent",
    icon: Users,
    label: "Parent",
    description:
      "You are the parent of someone who was diagnosed with a compensable cancer",
    requirements: [
      "Death certificate of child",
      "Birth certificates",
      "Staff will contact you for additional documents",
    ],
  },
  {
    value: "Grandchild",
    icon: User,
    label: "Grandchild",
    description:
      "You are the grandchild of someone who was diagnosed with a compensable cancer",
    requirements: [
      "Death certificate of grandparent",
      "Birth certificates",
      "Staff will contact you for additional documents",
    ],
  },
  {
    value: "Grandparent",
    icon: Users,
    label: "Grandparent",
    description:
      "You are the grandparent of someone who was diagnosed with a compensable cancer",
    requirements: [
      "Death certificate of grandchild",
      "Birth certificates",
      "Staff will contact you for additional documents",
    ],
  },
];

export function Part3Form({
  initialData,
  onSubmit,
  filingForSelf,
}: Part3FormProps) {
  const form = useForm<Part3FormData>({
    resolver: zodResolver(part3Schema),
    defaultValues: {
      relationship:
        initialData?.relationship ||
        (filingForSelf === true ? "Self" : undefined),
    },
  });

  const selectedRelationship = form.watch("relationship");

  const handleSubmit = useCallback(
    async (data: Part3FormData) => {
      await onSubmit(data as Part3Relationship);
      return true;
    },
    [onSubmit]
  );

  // Expose form submission to FormWizard
  React.useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handleSubmit(data);
            resolve(true);
          },
          () => {
            resolve(false); // Validation failed
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
      {/* Filing For Self Confirmation */}
      {filingForSelf === true && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-700">
                <p className="mb-1 font-semibold">
                  Confirm: Filing for Yourself
                </p>
                <p>
                  Based on your selection in Part 1, we've automatically
                  selected "Self" below. This means you are the person who
                  became ill from radiation exposure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="text-sm text-sage-700">
              <p className="mb-1 font-semibold">About Part 3</p>
              <p>
                Your relationship to the person who became ill determines which
                documents you'll need to provide. Select the option that best
                describes your relationship.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relationship Selection */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            {initialData?.relationship
              ? "Your Relationship"
              : "Select Your Relationship"}
          </CardTitle>
          <CardDescription className="text-sage-600">
            {initialData?.relationship
              ? "Your relationship to the person who became ill (based on your earlier selection)"
              : "Choose your relationship to the person who became ill with a compensable disease"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={form.watch("relationship")}
            onValueChange={(value) =>
              form.setValue("relationship", value as RelationshipType)
            }
            className="space-y-4"
          >
            {relationshipOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRelationship === option.value;

              return (
                <div
                  key={option.value}
                  className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                    isSelected
                      ? "border-terracotta-500 bg-terracotta-50"
                      : "border-cream-200 bg-white hover:border-sage-300 hover:bg-sage-50"
                  } `}
                  onClick={() => form.setValue("relationship", option.value)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-terracotta-500 text-white"
                          : "bg-sage-100 text-sage-600"
                      } `}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="border-2"
                        />
                        <Label
                          htmlFor={option.value}
                          className="cursor-pointer text-lg font-semibold text-sage-900"
                        >
                          {option.label}
                        </Label>
                      </div>

                      <p className="mb-3 text-sm text-sage-700">
                        {option.description}
                      </p>

                      {isSelected && (
                        <div className="rounded-lg border border-terracotta-200 bg-white p-3">
                          <p className="mb-2 text-xs font-semibold text-terracotta-900">
                            Required Documents:
                          </p>
                          <ul className="space-y-1 text-xs text-sage-700">
                            {option.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-0.5 text-terracotta-500">
                                  •
                                </span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>

          {form.formState.errors.relationship && (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.relationship.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Award Distribution Info for Children */}
      {selectedRelationship === "Child" && (
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="mb-1 font-semibold">Important for Children</p>
                <p className="mb-2">
                  If filing as a surviving child, please note:
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>All eligible siblings must be disclosed</li>
                  <li>
                    The $100,000 award is shared equally among all eligible
                    children
                  </li>
                  <li>Death certificates required for any deceased siblings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
