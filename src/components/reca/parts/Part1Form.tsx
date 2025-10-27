"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part1FilerInfo } from "@/lib/reca/types";
import { FormField } from "@/components/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const part1Schema = z.object({
  firstName: z.string().min(1, "First name is required").max(12),
  middleName: z.string().max(12).optional(),
  lastName: z.string().min(1, "Last name is required").max(20),
  formerNames: z.string().max(20).optional(),
  ssn: z
    .string()
    .regex(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in format XXX-XX-XXXX"),
  dob: z.string().min(1, "Date of birth is required"),
  mailingAddress: z.string().min(1, "Mailing address is required").max(60),
  city: z.string().min(1, "City is required").max(20),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  phoneDay: z.string().optional(),
  phoneEvening: z.string().optional(),
  email: z.string().email("Invalid email address").max(30).optional().or(z.literal("")),
  residenceAddress: z.string().max(60).optional(),
  tribalAffiliation: z.string().max(30).optional(),
  tribalCensusNumber: z.string().max(20).optional(),
});

type Part1FormData = z.infer<typeof part1Schema>;

interface Part1FormProps {
  initialData?: Partial<Part1FilerInfo>;
  onSubmit: (data: Part1FilerInfo) => void;
}

export function Part1Form({ initialData, onSubmit }: Part1FormProps) {
  const form = useForm<Part1FormData>({
    resolver: zodResolver(part1Schema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      middleName: initialData?.middleName || "",
      lastName: initialData?.lastName || "",
      formerNames: initialData?.formerNames || "",
      ssn: initialData?.ssn || "",
      dob: initialData?.dob || "",
      mailingAddress: initialData?.mailingAddress || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      phoneDay: initialData?.phoneDay || "",
      phoneEvening: initialData?.phoneEvening || "",
      email: initialData?.email || "",
      residenceAddress: initialData?.residenceAddress || "",
      tribalAffiliation: initialData?.tribalAffiliation || "",
      tribalCensusNumber: initialData?.tribalCensusNumber || "",
    },
  });

  const handleSubmit = (data: Part1FormData) => {
    onSubmit(data as Part1FilerInfo);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Info Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sage-700">
              <p className="font-semibold mb-1">About Part 1</p>
              <p>
                This section collects information about <strong>YOU</strong>, the
                person filling out this form. If you are filing for someone else
                who became ill, we'll collect their information in the next
                section.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Personal Information</CardTitle>
          <CardDescription className="text-sage-600">
            Your legal name and contact details
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
            helperText="Include if you've changed your name due to marriage or other reasons"
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
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Contact Information</CardTitle>
          <CardDescription className="text-sage-600">
            How we can reach you about your claim
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            form={form}
            name="mailingAddress"
            label="Mailing Address"
            required
            maxLength={60}
            helperText="Street address where you receive mail"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <FormField form={form} name="city" label="City" required maxLength={20} />
            <FormField
              form={form}
              name="state"
              label="State"
              type="select"
              options={US_STATES}
              required
            />
            <FormField
              form={form}
              name="zipCode"
              label="ZIP Code"
              required
              placeholder="12345"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              form={form}
              name="phoneDay"
              label="Phone (Daytime)"
              type="tel"
              placeholder="(XXX) XXX-XXXX"
            />
            <FormField
              form={form}
              name="phoneEvening"
              label="Phone (Evening)"
              type="tel"
              placeholder="(XXX) XXX-XXXX"
            />
            <FormField
              form={form}
              name="email"
              label="Email Address"
              type="email"
              maxLength={30}
            />
          </div>

          <FormField
            form={form}
            name="residenceAddress"
            label="Residence Address (if different)"
            maxLength={60}
            helperText="Only fill if different from mailing address"
          />
        </CardContent>
      </Card>

      {/* Tribal Affiliation (Optional) */}
      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Tribal Affiliation (Optional)
          </CardTitle>
          <CardDescription className="text-sage-600">
            If you are a member of an Indian Tribe and want the RECA Program to
            request tribal enrollment information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              form={form}
              name="tribalAffiliation"
              label="Tribe"
              maxLength={30}
              placeholder="e.g., Navajo Nation"
            />
            <FormField
              form={form}
              name="tribalCensusNumber"
              label="Census Number"
              maxLength={20}
              helperText="If known"
            />
          </div>

          <div className="rounded-lg bg-cream-50 p-4 text-sm text-sage-700">
            <p className="font-medium mb-2">Tribal Assistance Available:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Navajo Uranium Workers' Program</li>
              <li>Other tribal organizations (please specify)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
