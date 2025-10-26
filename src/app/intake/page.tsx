"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { claimantSchema, ClaimantFormData } from "@/lib/validations/claimant";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

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

export default function IntakePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ClaimantFormData>({
    resolver: zodResolver(claimantSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      address1: "",
      address2: "",
      city: "",
      county: "",
      state: "",
      postalCode: "",
      referralCode: "",
    },
  });

  const onSubmit = async (data: ClaimantFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/claimants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      const claimant = await response.json();
      router.push(`/intake/upload?claimantId=${claimant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-3xl px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Claimant Intake Form</CardTitle>
            <CardDescription>
              Please fill out all required information to begin your claim
              process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  form={form}
                  name="firstName"
                  label="First Name"
                  required
                />
                <FormField
                  form={form}
                  name="lastName"
                  label="Last Name"
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  form={form}
                  name="email"
                  label="Email"
                  type="email"
                  required
                />
                <FormField
                  form={form}
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  required
                />
              </div>

              <FormField
                form={form}
                name="dob"
                label="Date of Birth"
                type="date"
                required
              />

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Address Information</h3>

                <FormField
                  form={form}
                  name="address1"
                  label="Address Line 1"
                  required
                />
                <FormField
                  form={form}
                  name="address2"
                  label="Address Line 2"
                  placeholder="Apt, Suite, etc. (optional)"
                />

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField form={form} name="city" label="City" required />
                  <FormField
                    form={form}
                    name="county"
                    label="County"
                    required
                  />
                  <FormField
                    form={form}
                    name="state"
                    label="State"
                    type="select"
                    options={US_STATES}
                    required
                  />
                </div>

                <FormField
                  form={form}
                  name="postalCode"
                  label="Postal Code"
                  required
                />
              </div>

              <div className="border-t pt-6">
                <FormField
                  form={form}
                  name="referralCode"
                  label="Referral Code"
                  placeholder="Enter code if you have one (optional)"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Continue to Upload"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
