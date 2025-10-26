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
import { Heart, CheckCircle } from "lucide-react";

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
  const [accountCreated, setAccountCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);

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

      const result = await response.json();

      // Store account credentials if created
      if (result.credentials) {
        setAccountCreated({
          email: result.credentials.email,
          password: result.credentials.temporaryPassword,
        });
      }

      // Small delay to show credentials before redirect
      setTimeout(() => {
        router.push(`/intake/step2?claimantId=${result.claimant.id}`);
      }, result.credentials ? 5000 : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <Link href="/">
            <Button variant="outline" className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50">
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            Start Your Free Claim Packet
          </h1>
          <p className="text-lg text-sage-700">
            Fill out the information below to begin. We'll guide you through every step.
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">Claimant Information</CardTitle>
            <CardDescription className="text-sage-600">
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

              <div className="space-y-4 border-t border-cream-200 pt-6">
                <h3 className="text-lg font-semibold text-sage-900">Address Information</h3>

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

              <div className="rounded-2xl bg-gradient-to-br from-peach-50 to-cream-100 p-6">
                <FormField
                  form={form}
                  name="referralCode"
                  label="Referral Code (Optional)"
                  placeholder="Enter code if you have one"
                />
                <p className="mt-2 text-xs text-sage-600">
                  Have a referral code? Enter it here to help us connect you with the right resources.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl bg-terracotta-50 p-4 text-sm text-terracotta-800 border border-terracotta-200">
                  {error}
                </div>
              )}

              {accountCreated && (
                <div className="rounded-2xl bg-emerald-50 p-6 border-2 border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-900 mb-2">
                        Account Created Successfully!
                      </h3>
                      <p className="text-sm text-emerald-800 mb-3">
                        We've created your RadiantClaims account. Save these credentials
                        to log in and track your claim status:
                      </p>
                      <div className="rounded-lg bg-white p-4 border border-emerald-200 mb-3">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-sage-700">Email:</span>{" "}
                            <code className="text-sage-900">{accountCreated.email}</code>
                          </div>
                          <div>
                            <span className="font-medium text-sage-700">Temporary Password:</span>{" "}
                            <code className="text-sage-900 font-mono bg-cream-100 px-2 py-1 rounded">
                              {accountCreated.password}
                            </code>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Redirecting to document upload in 5 seconds...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-terracotta-500 px-8 hover:bg-terracotta-600"
                >
                  {isSubmitting ? "Submitting..." : "Continue to Upload →"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6 text-center">
          <p className="text-sm text-sage-700">
            <strong>100% free for claimants.</strong> We prepare your documents at no cost to you.
            Attorney fees are paid directly to the law firm and are capped at 2% by federal statute.
          </p>
        </div>
      </main>

      <footer className="mt-20 border-t border-cream-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
                <Heart className="h-4 w-4 text-white" fill="white" />
              </div>
              <span className="font-semibold text-sage-800">RadiantClaims</span>
            </div>
            <p className="text-sm text-sage-600">
              &copy; 2024 RadiantClaims. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                href={"/terms" as any}
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                Terms
              </Link>
              <Link
                href={"/privacy" as any}
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                Privacy
              </Link>
              <Link
                href="/how-it-works"
                className="text-sage-600 transition-colors hover:text-terracotta-600"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
