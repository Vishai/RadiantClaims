"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveUserData } from "@/lib/user-data-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Gift,
  Info,
  MapPin,
  Activity,
  Calendar,
  User,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types for form data
type UserIntent =
  | "self"
  | "deceased-relative"
  | "someone-else"
  | "someone-else-relative";

type ResidenceState = "UT" | "ID" | "NM" | "AZ" | "NV" | "none";

interface FormData {
  // Step 1: Intent
  intent: UserIntent | "";

  // Step 2: Basic Info (conditional on intent)
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string; // For deceased or referral (now a select)
  otherRelationship: string; // For "Other" option in relationship

  // Deceased relative's name (for deceased-relative and someone-else-relative intents)
  deceasedFirstName: string;
  deceasedLastName: string;
  deceasedDOD: string; // Date of death - CRITICAL for eligibility determination

  // Step 3: Residence
  residenceState: ResidenceState | "";
  residenceDuration: "yes" | "july1962" | "no" | "";
  residenceStartYear: string;
  arizonaCounty: string;
  nevadaCounty: string;

  // Step 4: Cancer
  hasCancer: "yes" | "no" | "";
  cancerType: string;
  diagnosisYear: string;

  // Step 5: Timing
  latencyMet: "yes" | "no" | "unsure" | "";

  // Referral info (when applicable)
  referrerName: string;
  referrerEmail: string;
  referrerPhone: string;
  referrerConsent: boolean;
}

const COVERED_CANCERS = [
  "Leukemia (except chronic lymphocytic)",
  "Lymphoma (all types)",
  "Multiple myeloma",
  "Thyroid cancer",
  "Breast cancer",
  "Lung cancer",
  "Esophageal cancer",
  "Stomach cancer",
  "Pharyngeal cancer",
  "Colon cancer",
  "Pancreatic cancer",
  "Bile duct cancer",
  "Gallbladder cancer",
  "Small intestine cancer",
  "Brain cancer",
  "Liver cancer (except cirrhosis/hepatitis)",
  "Salivary gland cancer",
  "Bladder cancer",
  "Kidney cancer",
  "Ovarian cancer",
  "Other (check DOJ list)",
];

const ARIZONA_COUNTIES = [
  "Apache",
  "Coconino",
  "Gila",
  "Mohave",
  "Navajo",
  "Yavapai",
  "North of Grand Canyon",
];

const NEVADA_COUNTIES = [
  "Eureka",
  "Lander",
  "Lincoln",
  "Nye",
  "White Pine",
  "Clark County (townships 13-16, ranges 63-71)",
];

export default function EligibilityCheckPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    intent: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    relationship: "",
    otherRelationship: "",
    deceasedFirstName: "",
    deceasedLastName: "",
    deceasedDOD: "",
    residenceState: "",
    residenceDuration: "",
    residenceStartYear: "",
    arizonaCounty: "",
    nevadaCounty: "",
    hasCancer: "",
    cancerType: "",
    diagnosisYear: "",
    latencyMet: "", // We'll still use this to store the calculated result
    referrerName: "",
    referrerEmail: "",
    referrerPhone: "",
    referrerConsent: false,
  });

  // Update form data
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Navigation
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Helper: determine exposure start year from the answers we have.
  // - If they lived there >=1 year, we ask for the start year.
  // - If they qualify under the alternate rule (entire month of July 1962), use 1962.
  // - If they're unsure / don't meet the presence requirement, exposure is unknown.
  const getExposureStartYear = (): number | undefined => {
    if (formData.residenceDuration === "july1962") return 1962;

    if (formData.residenceDuration === "yes") {
      const startYear = parseInt(formData.residenceStartYear);
      if (Number.isFinite(startYear)) return Math.max(1951, startYear);
    }

    return undefined;
  };

  // Helper to calculate latency status.
  // Returns:
  // - true/false when we can compute it
  // - undefined when we can't (e.g., presence not confirmed)
  const checkLatency = (): boolean | undefined => {
    if (!formData.diagnosisYear || !formData.cancerType) return undefined;

    const exposureStart = getExposureStartYear();
    if (!exposureStart) return undefined;

    const diagYear = parseInt(formData.diagnosisYear);
    if (!Number.isFinite(diagYear)) return undefined;

    // Latency requirement: 2 years for Leukemia, 5 for others
    const isLeukemia = formData.cancerType.toLowerCase().includes("leukemia");
    const requiredYears = isLeukemia ? 2 : 5;

    // Diagnosis must be AFTER the required latency period
    // e.g. Exposed 1951, Leukemia (2 yrs) -> Diagnosis >= 1953
    return diagYear - exposureStart >= requiredYears;
  };

  // Calculate eligibility
  const calculateEligibility = () => {
    const isCoveredResidenceState =
      formData.residenceState !== "" && formData.residenceState !== "none";

    const residenceConfirmed =
      isCoveredResidenceState &&
      (formData.residenceDuration === "yes" ||
        formData.residenceDuration === "july1962");

    const hasCoveredCancer = formData.hasCancer === "yes";

    // Use calculated latency check (tri-state)
    const meetsLatency = checkLatency();

    if (residenceConfirmed && hasCoveredCancer && meetsLatency === true) {
      return "likely";
    }

    if (residenceConfirmed && hasCoveredCancer && meetsLatency === false) {
      return "unlikely";
    }

    // Explicit disqualifiers
    if (formData.residenceState === "none" || formData.hasCancer === "no") {
      return "ineligible";
    }

    // If we're missing confirmation (e.g., "not sure" on presence), do not hard-reject.
    // We should route these cases to professional review.
    return "needs-review";
  };

  // Submit handler
  const handleSubmit = async () => {
    const eligibility = calculateEligibility();

    const latency = checkLatency();
    const latencyMet: FormData["latencyMet"] =
      latency === true ? "yes" : latency === false ? "no" : "unsure";

    // Store user data for prefilling other forms
    saveUserData(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      "eligibility"
    );

    try {
      // Send to API
      const response = await fetch("/api/eligibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, latencyMet }),
      });

      if (!response.ok) {
        console.error("Failed to submit eligibility check");
      } else {
        // Store eligibility data from API response for workflow creation
        const result = await response.json();
        if (result.eligibilityData) {
          localStorage.setItem(
            "recaEligibilityData",
            JSON.stringify(result.eligibilityData)
          );
        }
      }
    } catch (error) {
      console.error("Error submitting:", error);
    }

    // Navigate to result page
    const params = new URLSearchParams({
      eligibility,
      intent: formData.intent,
      name: `${formData.firstName} ${formData.lastName}`,
    });
    router.push(`/eligibility-check/result?${params.toString()}`);
  };

  // Helper to get pronoun based on intent
  const getPronoun = () => {
    return formData.intent === "self" ? "you" : "they";
  };

  const getSubjectName = () => {
    if (formData.intent === "self") return "you";

    // For deceased relative cases, use the deceased person's name
    if (
      formData.intent === "deceased-relative" ||
      formData.intent === "someone-else-relative"
    ) {
      if (formData.deceasedFirstName) return formData.deceasedFirstName;
      return "the deceased";
    }

    // For someone-else referrals, use the referred person's name
    if (formData.firstName) return formData.firstName;
    return "they";
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-sage-900">
                Who Are You Checking For?
              </h2>
              <p className="text-lg text-sage-600">
                Let's understand your situation so we can ask the right
                questions
              </p>
            </div>

            <RadioGroup
              value={formData.intent}
              onValueChange={(value) =>
                updateFormData("intent", value as UserIntent)
              }
            >
              <div className="space-y-4">
                <div className="group relative overflow-hidden rounded-2xl border-2 border-cream-200 bg-gradient-to-br from-white to-cream-50 p-5 transition-all hover:border-sage-400 hover:shadow-md">
                  <RadioGroupItem
                    value="self"
                    id="self"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  />
                  <Label
                    htmlFor="self"
                    className="flex cursor-pointer items-start gap-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700 transition-colors group-hover:bg-sage-200">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pr-12">
                      <div className="mb-1 text-lg font-semibold text-sage-900">
                        Checking for myself
                      </div>
                      <div className="text-sm text-sage-600">
                        I lived in the affected area and may have been diagnosed
                        with cancer
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border-2 border-cream-200 bg-gradient-to-br from-white to-peach-50 p-5 transition-all hover:border-sage-400 hover:shadow-md">
                  <RadioGroupItem
                    value="deceased-relative"
                    id="deceased-relative"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  />
                  <Label
                    htmlFor="deceased-relative"
                    className="flex cursor-pointer items-start gap-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-peach-100 text-terracotta-700 transition-colors group-hover:bg-peach-200">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pr-12">
                      <div className="mb-1 text-lg font-semibold text-sage-900">
                        Filing for a deceased family member
                      </div>
                      <div className="text-sm text-sage-600">
                        I'm a survivor (spouse, child, parent, grandchild, or
                        grandparent) filing on their behalf
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border-2 border-terracotta-200 bg-gradient-to-br from-white to-terracotta-50 p-5 transition-all hover:border-terracotta-400 hover:shadow-md">
                  <RadioGroupItem
                    value="someone-else"
                    id="someone-else"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  />
                  <Label
                    htmlFor="someone-else"
                    className="flex cursor-pointer items-start gap-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-700 transition-colors group-hover:bg-terracotta-200">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pr-12">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-semibold text-sage-900">
                          Referring someone who might qualify
                        </span>
                        <span className="rounded-full bg-terracotta-500 px-2 py-0.5 text-xs font-bold text-white">
                          Earn $50
                        </span>
                      </div>
                      <div className="text-sm text-sage-600">
                        I know someone who lived in the area and had cancer —
                        I'd like to help them and earn a referral reward
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border-2 border-cream-200 bg-gradient-to-br from-white to-sage-50 p-5 transition-all hover:border-sage-400 hover:shadow-md">
                  <RadioGroupItem
                    value="someone-else-relative"
                    id="someone-else-relative"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  />
                  <Label
                    htmlFor="someone-else-relative"
                    className="flex cursor-pointer items-start gap-4"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700 transition-colors group-hover:bg-sage-200">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pr-12">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-semibold text-sage-900">
                          Checking if someone's relative qualifies
                        </span>
                        <span className="rounded-full bg-terracotta-500 px-2 py-0.5 text-xs font-bold text-white">
                          Earn $50
                        </span>
                      </div>
                      <div className="text-sm text-sage-600">
                        Their deceased family member lived in the area and had
                        cancer
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {/* Referral reward info callout */}
            {(formData.intent === "someone-else" ||
              formData.intent === "someone-else-relative") && (
              <div className="rounded-2xl border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-peach-50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-terracotta-600" />
                  <h3 className="font-semibold text-terracotta-900">
                    About the $50 Referral Reward
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-sage-700">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>
                      We help them complete their claim with affordable DIY
                      service or no-upfront-cost legal representation
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>
                      If the DOJ approves their $100,000 award, you receive $50
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>
                      Payment within 30 days of their award notification
                    </span>
                  </li>
                </ul>
              </div>
            )}

            <Button
              onClick={nextStep}
              disabled={!formData.intent}
              size="lg"
              className="w-full rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-7 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              Continue <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-sage-900">
                {formData.intent === "self"
                  ? "Your Contact Information"
                  : formData.intent === "deceased-relative"
                    ? "Your Information & Relationship"
                    : "Their Contact Information"}
              </h2>
              <p className="text-lg text-sage-600">
                {formData.intent === "someone-else" ||
                formData.intent === "someone-else-relative"
                  ? "So we can reach out and help them with their claim"
                  : "So we can get in touch with you about your claim"}
              </p>
            </div>

            <div className="space-y-4">
              {/* For deceased-relative and someone-else-relative, first collect deceased person's info */}
              {(formData.intent === "deceased-relative" ||
                formData.intent === "someone-else-relative") && (
                <>
                  <div className="rounded-xl border-2 border-peach-200 bg-peach-50 p-4">
                    <h3 className="mb-3 font-semibold text-sage-900">
                      Deceased Family Member's Information
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="deceasedFirstName"
                          className="mb-2 block font-medium text-sage-800"
                        >
                          First Name
                        </Label>
                        <Input
                          id="deceasedFirstName"
                          value={formData.deceasedFirstName}
                          onChange={(e) =>
                            updateFormData("deceasedFirstName", e.target.value)
                          }
                          placeholder="John"
                          className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="deceasedLastName"
                          className="mb-2 block font-medium text-sage-800"
                        >
                          Last Name
                        </Label>
                        <Input
                          id="deceasedLastName"
                          value={formData.deceasedLastName}
                          onChange={(e) =>
                            updateFormData("deceasedLastName", e.target.value)
                          }
                          placeholder="Smith"
                          className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                        />
                      </div>
                    </div>

                    {/* Date of Death - CRITICAL for eligibility */}
                    <div className="mt-4">
                      <Label
                        htmlFor="deceasedDOD"
                        className="mb-2 block font-medium text-sage-800"
                      >
                        Date of Death <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="deceasedDOD"
                        type="date"
                        value={formData.deceasedDOD}
                        onChange={(e) =>
                          updateFormData("deceasedDOD", e.target.value)
                        }
                        className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                      />
                      <p className="mt-2 text-xs text-sage-600">
                        Note: If the person is still living, they must file the
                        claim themselves (not through a survivor)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Filer's contact information */}
              <div>
                <h3 className="mb-3 font-semibold text-sage-900">
                  {formData.intent === "deceased-relative"
                    ? "Your Contact Information"
                    : formData.intent === "someone-else-relative"
                      ? "Person Filing on Behalf Contact Information"
                      : "Contact Information"}
                </h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="firstName"
                        className="mb-2 block font-medium text-sage-800"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          updateFormData("firstName", e.target.value)
                        }
                        placeholder="John"
                        className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="lastName"
                        className="mb-2 block font-medium text-sage-800"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          updateFormData("lastName", e.target.value)
                        }
                        placeholder="Smith"
                        className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="mb-2 block font-medium text-sage-800"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="john.smith@example.com"
                      className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className="mb-2 block font-medium text-sage-800"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                    />
                  </div>

                  {(formData.intent === "deceased-relative" ||
                    formData.intent === "someone-else-relative") && (
                    <div>
                      <Label
                        htmlFor="relationship"
                        className="mb-2 block font-medium text-sage-800"
                      >
                        Relationship to Deceased{" "}
                        <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={formData.relationship}
                        onValueChange={(value) =>
                          updateFormData("relationship", value)
                        }
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400">
                          <SelectValue placeholder="Select relationship..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="surviving-spouse">
                            Surviving Spouse
                          </SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="grandchild">Grandchild</SelectItem>
                          <SelectItem value="grandparent">
                            Grandparent
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-sm text-sage-600">
                        Only spouse, children, parents, grandchildren, or
                        grandparents can file
                      </p>

                      {/* Other relationship text field - shown when "Other" is selected */}
                      {formData.relationship === "other" && (
                        <div className="mt-4">
                          <Label
                            htmlFor="otherRelationship"
                            className="mb-2 block font-medium text-sage-800"
                          >
                            Please specify relationship{" "}
                            <span className="text-red-600">*</span>
                          </Label>
                          <Input
                            id="otherRelationship"
                            value={formData.otherRelationship}
                            onChange={(e) =>
                              updateFormData(
                                "otherRelationship",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Sibling, Cousin, etc."
                            className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                          />
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Note: Relationships other than those listed may not
                            be eligible to file claims
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={prevStep}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-2 py-6"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  ((formData.intent === "deceased-relative" ||
                    formData.intent === "someone-else-relative") &&
                    (!formData.deceasedFirstName ||
                      !formData.deceasedLastName ||
                      !formData.deceasedDOD ||
                      !formData.relationship ||
                      (formData.relationship === "other" &&
                        !formData.otherRelationship)))
                }
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-6"
              >
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <TooltipProvider>
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h2 className="mb-3 text-3xl font-bold text-sage-900">
                  Residence During Nuclear Testing
                </h2>
                <p className="text-lg text-sage-600">
                  Did {getSubjectName()} live in one of the affected areas
                  between 1951-1962?
                </p>
              </div>

              <div>
                <Label className="mb-3 block text-lg font-medium text-sage-800">
                  Which state did {getPronoun()} live in?
                </Label>
                <RadioGroup
                  value={formData.residenceState}
                  onValueChange={(value) =>
                    updateFormData("residenceState", value as ResidenceState)
                  }
                >
                  <div className="space-y-3">
                    {[
                      {
                        value: "UT",
                        label: "Utah",
                        subtitle: "All counties qualify",
                      },
                      {
                        value: "ID",
                        label: "Idaho",
                        subtitle: "All counties qualify",
                      },
                      {
                        value: "NM",
                        label: "New Mexico",
                        subtitle: "All counties qualify",
                      },
                      {
                        value: "AZ",
                        label: "Arizona",
                        subtitle: "Specific counties only",
                        info: "Apache, Coconino, Gila, Mohave, Navajo, Yavapai, and area north of Grand Canyon",
                      },
                      {
                        value: "NV",
                        label: "Nevada",
                        subtitle: "Specific counties only",
                        info: "Eureka, Lander, Lincoln, Nye, White Pine, and parts of Clark County",
                      },
                    ].map((state) => (
                      <div
                        key={state.value}
                        className="group relative overflow-hidden rounded-xl border-2 border-cream-200 bg-white p-4 transition-all hover:border-sage-300 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value={state.value}
                            id={state.value}
                          />
                          <Label
                            htmlFor={state.value}
                            className="flex flex-1 cursor-pointer items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-sage-900">
                                {state.label}
                              </div>
                              <div className="text-sm text-sage-600">
                                {state.subtitle}
                              </div>
                            </div>
                            {state.info && (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="ml-2 flex-shrink-0 text-terracotta-500 transition-colors hover:text-terracotta-700"
                                  >
                                    <Info className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm">{state.info}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-xl border-2 border-cream-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-sage-900">
                            None of these states
                          </div>
                          <div className="text-sm text-sage-600">
                            Lived elsewhere or not sure
                          </div>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {formData.residenceState === "AZ" && (
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                  <Label
                    htmlFor="arizonaCounty"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Which Arizona county?{" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.arizonaCounty}
                    onValueChange={(value) =>
                      updateFormData("arizonaCounty", value)
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-cream-200 bg-white focus:border-sage-400">
                      <SelectValue placeholder="Select county..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ARIZONA_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.residenceState === "NV" && (
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                  <Label
                    htmlFor="nevadaCounty"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Which Nevada county? <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.nevadaCounty}
                    onValueChange={(value) =>
                      updateFormData("nevadaCounty", value)
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-cream-200 bg-white focus:border-sage-400">
                      <SelectValue placeholder="Select county..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NEVADA_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.residenceState &&
                formData.residenceState !== "none" && (
                  <div className="rounded-2xl border-2 border-sage-200 bg-sage-50 p-5">
                    <Label className="mb-3 block text-lg font-medium text-sage-900">
                      Did {getPronoun()} live there for at least 1 full year
                      between January 1951 - November 1962?
                    </Label>
                    <RadioGroup
                      value={formData.residenceDuration}
                      onValueChange={(value) => {
                        const v = value as "yes" | "july1962" | "no";
                        updateFormData("residenceDuration", v);

                        // If the user selects the July 1962 alternate rule,
                        // we can safely set an approximate exposure start year.
                        if (v === "july1962") {
                          updateFormData("residenceStartYear", "1962");
                        }

                        // If they switch away from "yes", clear the start year unless we need it.
                        if (v !== "yes" && v !== "july1962") {
                          updateFormData("residenceStartYear", "");
                        }
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border-2 border-cream-200 bg-white p-4">
                          <RadioGroupItem value="yes" id="duration-yes" />
                          <Label
                            htmlFor="duration-yes"
                            className="flex-1 cursor-pointer font-medium"
                          >
                            Yes, at least 1 full year
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border-2 border-cream-200 bg-white p-4">
                          <RadioGroupItem
                            value="july1962"
                            id="duration-july1962"
                          />
                          <Label
                            htmlFor="duration-july1962"
                            className="flex-1 cursor-pointer font-medium"
                          >
                            Entire month of July 1962 (alternate rule)
                          </Label>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border-2 border-cream-200 bg-white p-4">
                          <RadioGroupItem value="no" id="duration-no" />
                          <Label
                            htmlFor="duration-no"
                            className="flex-1 cursor-pointer font-medium"
                          >
                            No, or I'm not sure
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {formData.residenceDuration === "yes" && (
                      <div className="mt-4">
                        <Label
                          htmlFor="residenceStartYear"
                          className="mb-2 block font-medium text-sage-800"
                        >
                          Year {getPronoun()} began living in the affected area
                        </Label>
                        <Input
                          id="residenceStartYear"
                          type="number"
                          value={formData.residenceStartYear}
                          onChange={(e) =>
                            updateFormData("residenceStartYear", e.target.value)
                          }
                          placeholder="e.g., 1955"
                          min="1940"
                          max="1962"
                          className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                        />
                        <p className="mt-2 text-sm text-sage-600">
                          If {getPronoun()} lived there before 1951, enter 1951.
                        </p>
                      </div>
                    )}

                    {formData.residenceDuration === "july1962" && (
                      <p className="mt-4 text-sm text-sage-700">
                        This is an alternate RECA presence rule: living in the
                        covered area for the entire month of July 1962 can
                        qualify even without a full year of residence.
                      </p>
                    )}
                  </div>
                )}

              <div className="flex gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-full border-2 py-6"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={
                    !formData.residenceState ||
                    (formData.residenceState === "AZ" &&
                      !formData.arizonaCounty) ||
                    (formData.residenceState === "NV" &&
                      !formData.nevadaCounty) ||
                    (formData.residenceState !== "none" &&
                      !formData.residenceDuration) ||
                    (formData.residenceDuration === "yes" &&
                      !formData.residenceStartYear)
                  }
                  size="lg"
                  className="flex-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-6"
                >
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </TooltipProvider>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-sage-900">
                Cancer Diagnosis
              </h2>
              <p className="text-lg text-sage-600">
                Information about the cancer diagnosis
              </p>
            </div>

            <div className="rounded-2xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-5">
              <Label className="mb-4 block text-lg font-medium text-sage-900">
                {formData.intent === "self"
                  ? "Have you"
                  : formData.intent === "deceased-relative" ||
                      formData.intent === "someone-else-relative"
                    ? "Had they"
                    : "Have they"}{" "}
                been diagnosed with cancer?
              </Label>
              <RadioGroup
                value={formData.hasCancer}
                onValueChange={(value) =>
                  updateFormData("hasCancer", value as "yes" | "no")
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border-2 border-cream-200 bg-white p-4">
                    <RadioGroupItem value="yes" id="cancer-yes" />
                    <Label
                      htmlFor="cancer-yes"
                      className="flex-1 cursor-pointer font-medium"
                    >
                      Yes, diagnosed with cancer
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border-2 border-cream-200 bg-white p-4">
                    <RadioGroupItem value="no" id="cancer-no" />
                    <Label
                      htmlFor="cancer-no"
                      className="flex-1 cursor-pointer font-medium"
                    >
                      No cancer diagnosis
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {formData.hasCancer === "yes" && (
              <>
                <div>
                  <Label
                    htmlFor="cancerType"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Type of Cancer (Primary Site){" "}
                    <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.cancerType}
                    onValueChange={(value) =>
                      updateFormData("cancerType", value)
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400">
                      <SelectValue placeholder="Select cancer type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COVERED_CANCERS.map((cancer) => (
                        <SelectItem key={cancer} value={cancer}>
                          {cancer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-sm text-sage-600">
                    Must be the primary cancer site (not metastatic)
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="diagnosisYear"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Year of Diagnosis
                  </Label>
                  <Input
                    id="diagnosisYear"
                    type="number"
                    value={formData.diagnosisYear}
                    onChange={(e) =>
                      updateFormData("diagnosisYear", e.target.value)
                    }
                    placeholder="e.g., 1975"
                    min="1940"
                    max={new Date().getFullYear()}
                    className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button
                onClick={prevStep}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-2 py-6"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={
                  !formData.hasCancer ||
                  (formData.hasCancer === "yes" &&
                    (!formData.cancerType || !formData.diagnosisYear))
                }
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-6"
              >
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 5:
        const latencyResult = checkLatency();
        const isLeukemia = formData.cancerType
          .toLowerCase()
          .includes("leukemia");
        const requiredYears = isLeukemia ? 2 : 5;

        const exposureStart = getExposureStartYear();
        const diagYear = parseInt(formData.diagnosisYear || "0");
        const yearsElapsed = exposureStart ? diagYear - exposureStart : NaN;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-sage-900">
                Latency Period Analysis
              </h2>
              <p className="text-lg text-sage-600">
                Checking if the timing meets RECA requirements
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-sage-50 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-sage-900">
                <Info className="h-5 w-5 text-blue-600" />
                The Rule:
              </h3>
              <p className="text-sage-700">
                For{" "}
                <strong>{isLeukemia ? "Leukemia" : "this cancer type"}</strong>,
                the diagnosis must be at least{" "}
                <strong className="text-blue-700">{requiredYears} years</strong>{" "}
                after first exposure.
              </p>
            </div>

            <div
              className={`rounded-2xl border-2 p-6 ${
                latencyResult === true
                  ? "border-green-200 bg-green-50"
                  : latencyResult === false
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-blue-50"
              }`}
            >
              <h3
                className={`mb-2 text-xl font-bold ${
                  latencyResult === true
                    ? "text-green-800"
                    : latencyResult === false
                      ? "text-amber-800"
                      : "text-blue-800"
                }`}
              >
                {latencyResult === true
                  ? "Requirement Met"
                  : latencyResult === false
                    ? "Requirement Not Met"
                    : "Cannot Confirm Yet"}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="text-gray-600">
                    First Exposure (approx):
                  </span>
                  <span className="font-semibold">{exposureStart ?? "—"}</span>
                </div>
                <div className="flex justify-between border-b border-black/10 pb-2">
                  <span className="text-gray-600">Diagnosis Year:</span>
                  <span className="font-semibold">{diagYear}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-600">Time Elapsed:</span>
                  <span
                    className={`font-bold ${
                      latencyResult === true
                        ? "text-green-700"
                        : latencyResult === false
                          ? "text-amber-700"
                          : "text-blue-700"
                    }`}
                  >
                    {Number.isFinite(yearsElapsed)
                      ? `${yearsElapsed} years`
                      : "—"}
                  </span>
                </div>
              </div>

              {latencyResult === false && (
                <div className="mt-4 rounded-xl bg-white p-3 text-sm text-amber-800 shadow-sm">
                  <p>
                    <strong>Note:</strong> Even if the latency period isn't met
                    based on these dates, there may be exceptions or special
                    circumstances. We recommend continuing so an attorney can
                    review your specific case details.
                  </p>
                </div>
              )}

              {latencyResult === undefined && (
                <div className="mt-4 rounded-xl bg-white p-3 text-sm text-blue-800 shadow-sm">
                  <p>
                    <strong>Note:</strong> We can’t confirm the latency period
                    yet because the exposure period hasn’t been confirmed.
                    Consider gathering proof of residence (including the July
                    1962 alternate rule, if applicable) before paying for
                    document preparation.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={prevStep}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-2 py-6"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <Button
                onClick={
                  formData.intent === "someone-else" ||
                  formData.intent === "someone-else-relative"
                    ? nextStep
                    : handleSubmit
                }
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-6"
              >
                {formData.intent === "someone-else" ||
                formData.intent === "someone-else-relative"
                  ? "Continue"
                  : "See Results"}{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 6:
        // Referral information step
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-lg">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-3 text-3xl font-bold text-sage-900">
                Your Referral Information
              </h2>
              <p className="text-lg text-sage-600">
                Earn $50 when this referral is approved by the DOJ
              </p>
            </div>

            <div className="rounded-2xl border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-peach-50 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-terracotta-900">
                <CheckCircle2 className="h-5 w-5" />
                How Referral Rewards Work:
              </h3>
              <ul className="space-y-2 text-sm text-sage-700">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>
                    We reach out and help them complete their claim (free for
                    them)
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>
                    If the DOJ approves their $100,000 award, you receive $50
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>
                    Payment made by RadiantClaims within 30 days of approval
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label
                    htmlFor="referrerName"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Your Full Name
                  </Label>
                  <Input
                    id="referrerName"
                    value={formData.referrerName}
                    onChange={(e) =>
                      updateFormData("referrerName", e.target.value)
                    }
                    placeholder="Jane Doe"
                    className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="referrerEmail"
                    className="mb-2 block font-medium text-sage-800"
                  >
                    Your Email
                  </Label>
                  <Input
                    id="referrerEmail"
                    type="email"
                    value={formData.referrerEmail}
                    onChange={(e) =>
                      updateFormData("referrerEmail", e.target.value)
                    }
                    placeholder="jane@example.com"
                    className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="referrerPhone"
                  className="mb-2 block font-medium text-sage-800"
                >
                  Your Phone Number
                </Label>
                <Input
                  id="referrerPhone"
                  type="tel"
                  value={formData.referrerPhone}
                  onChange={(e) =>
                    updateFormData("referrerPhone", e.target.value)
                  }
                  placeholder="(555) 123-4567"
                  className="h-12 rounded-xl border-2 border-cream-200 focus:border-sage-400"
                />
              </div>

              <div className="rounded-xl border-2 border-sage-200 bg-sage-50 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="referrerConsent"
                    checked={formData.referrerConsent}
                    onCheckedChange={(checked) =>
                      updateFormData("referrerConsent", checked === true)
                    }
                    className="mt-1"
                  />
                  <Label
                    htmlFor="referrerConsent"
                    className="flex-1 cursor-pointer text-sm leading-relaxed text-sage-700"
                  >
                    I confirm that the person I'm referring has consented to be
                    contacted by RadiantClaims about their potential RECA claim.
                    I understand that I may receive $50 if their claim is
                    approved by the Department of Justice.
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={prevStep}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full border-2 py-6"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.referrerName ||
                  !formData.referrerEmail ||
                  !formData.referrerConsent
                }
                size="lg"
                className="flex-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 py-6"
              >
                Submit Referral <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine max steps based on intent
  const maxSteps =
    formData.intent === "someone-else" ||
    formData.intent === "someone-else-relative"
      ? 6
      : 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-peach-50">
      <nav className="sticky top-0 z-50 border-b border-cream-200 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-md">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-sage-800">
              RadiantClaims
            </span>
          </Link>
          <div className="flex gap-3">
            <Link href="/eligibility">
              <Button
                variant="outline"
                className="rounded-full border-2 border-sage-300 px-6 py-5 font-semibold hover:bg-sage-50"
              >
                <Info className="mr-2 h-4 w-4" />
                Full Details
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="mb-3 flex justify-between text-sm font-medium text-sage-700">
              <span>
                Step {step} of {maxSteps}
              </span>
              <span>{Math.round((step / maxSteps) * 100)}% Complete</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-cream-200 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 shadow-sm transition-all duration-500 ease-out"
                style={{ width: `${(step / maxSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Main card */}
          <Card className="overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-2xl">
            <CardHeader className="bg-gradient-to-br from-sage-50 to-cream-50 pb-8 text-center">
              <CardTitle className="text-4xl font-bold text-sage-900">
                Quick Eligibility Check
              </CardTitle>
              <CardDescription className="text-lg text-sage-600">
                Answer a few questions to see if you or someone you know might
                qualify for $100,000
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-10">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Help text */}
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white p-6 text-center">
              <h3 className="mb-2 font-semibold text-sage-900">
                Want More Detailed Information?
              </h3>
              <p className="mb-4 text-sm text-sage-600">
                Our comprehensive eligibility guide includes detailed
                explanations, examples, and all covered cancer types.
              </p>
              <Link href="/eligibility">
                <Button
                  variant="outline"
                  className="rounded-full border-2 border-sage-300 px-6 py-3 font-semibold hover:bg-sage-50"
                >
                  View Full Eligibility Requirements →
                </Button>
              </Link>
            </div>
            <p className="text-center text-xs text-sage-500">
              Questions? Contact us anytime for help with your eligibility check
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
