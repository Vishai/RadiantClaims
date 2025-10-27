"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part2ClaimantInfo } from "@/lib/reca/types";
import { FormField } from "@/components/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

const part2Schema = z.object({
  firstName: z.string().min(1, "First name is required").max(12),
  middleName: z.string().max(12).optional(),
  lastName: z.string().min(1, "Last name is required").max(20),
  formerNames: z.string().max(20).optional(),
  ssn: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  dob: z.string().min(1, "Date of birth is required"),
  dod: z.string().optional(),
});

type Part2FormData = z.infer<typeof part2Schema>;

interface Part2FormProps {
  initialData?: Partial<Part2ClaimantInfo>;
  onSubmit: (data: Part2ClaimantInfo) => void;
}

export function Part2Form({ initialData, onSubmit }: Part2FormProps) {
  const form = useForm<Part2FormData>({
    resolver: zodResolver(part2Schema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      formerNames: initialData?.formerNames || "",
      ssn: initialData?.ssn || "",
      dob: initialData?.dob || "",
      dod: initialData?.dod || "",
    },
  });

  const handleSubmit = (data: Part2FormData) => {
    onSubmit(data as Part2ClaimantInfo);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Info Card */}
      <Card className="border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-terracotta-900">
              <p className="font-semibold mb-1">About Part 2</p>
              <p>
                This section collects information about{" "}
                <strong>THE PERSON WHO BECAME ILL</strong> with a compensable
                disease. This is the individual who was exposed to radiation
                and developed cancer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claimant Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Claimant Information
          </CardTitle>
          <CardDescription className="text-sage-600">
            Information about the person who became ill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              form={form}
              name="firstName"
              label="First Name"
              required
              maxLength={12}
            />
            <FormField
              form={form}
              name="middleName"
              label="Middle Name"
              maxLength={12}
            />
            <FormField
              form={form}
              name="lastName"
              label="Last Name"
              required
              maxLength={20}
            />
          </div>

          <FormField
            form={form}
            name="formerNames"
            label="Former Names or Maiden Name"
            placeholder="If applicable"
            maxLength={20}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              form={form}
              name="ssn"
              label="Social Security Number"
              required
              placeholder="XXX-XX-XXXX"
              helperText="Format: XXX-XX-XXXX"
            />
            <FormField
              form={form}
              name="dob"
              label="Date of Birth"
              type="date"
              required
            />
          </div>

          <FormField
            form={form}
            name="dod"
            label="Date of Death"
            type="date"
            helperText="Leave blank if person is still living"
          />
        </CardContent>
      </Card>
    </form>
  );
}
