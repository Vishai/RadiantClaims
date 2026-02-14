"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part13Attorney } from "@/lib/reca/types";
import {
  DEFAULT_ATTORNEY_INFO,
  ATTORNEY_INFO_EDITABLE,
} from "@/lib/reca/attorney-info";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldLabel } from "@/components/reca/FieldLabel";
import { Input } from "@/components/ui/input";
import { Briefcase, Info, AlertCircle, Lock } from "lucide-react";

// US States for dropdown
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

// Validation schema
const part13Schema = z
  .object({
    hasAttorney: z.enum(["YES", "NO"], {
      required_error: "Please indicate whether you have hired an attorney",
    }),
    attorneyFirstName: z.string().optional(),
    attorneyLastName: z.string().optional(),
    attorneyFirm: z.string().optional(),
    attorneyAddress: z.string().optional(),
    attorneyCity: z.string().optional(),
    attorneyState: z.string().optional(),
    attorneyZip: z.string().optional(),
    attorneyPhone: z.string().optional(),
    attorneyFax: z.string().optional(),
    attorneyEmail: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If hasAttorney is YES, all attorney fields are required
      if (data.hasAttorney === "YES") {
        return (
          data.attorneyFirstName &&
          data.attorneyFirstName.trim().length > 0 &&
          data.attorneyLastName &&
          data.attorneyLastName.trim().length > 0 &&
          data.attorneyAddress &&
          data.attorneyAddress.trim().length > 0 &&
          data.attorneyCity &&
          data.attorneyCity.trim().length > 0 &&
          data.attorneyState &&
          data.attorneyState.trim().length > 0 &&
          data.attorneyZip &&
          data.attorneyZip.trim().length > 0 &&
          data.attorneyPhone &&
          data.attorneyPhone.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "All required attorney fields must be completed when attorney is hired",
      path: ["attorneyFirstName"],
    }
  );

type Part13FormData = z.infer<typeof part13Schema>;

interface Part13FormProps {
  initialData?: Partial<Part13Attorney>;
  onSubmit: (data: Part13Attorney) => void;
  userTier?: "DIY_PREP" | "LEGAL_REP" | null;
}

export default function Part13Form({
  initialData,
  onSubmit,
  userTier,
}: Part13FormProps) {
  // For DIY users, default to NO attorney representation
  const isDIYUser = userTier === "DIY_PREP";

  const form = useForm<Part13FormData>({
    resolver: zodResolver(part13Schema),
    defaultValues: {
      // DIY users: default to NO, Legal users: default to YES with attorney info
      hasAttorney:
        initialData?.hasAttorney ||
        (isDIYUser ? "NO" : DEFAULT_ATTORNEY_INFO.hasAttorney),
      attorneyFirstName:
        initialData?.attorneyFirstName ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyFirstName),
      attorneyLastName:
        initialData?.attorneyLastName ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyLastName),
      attorneyFirm:
        initialData?.attorneyFirm ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyFirm),
      attorneyAddress:
        initialData?.attorneyAddress ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyAddress),
      attorneyCity:
        initialData?.attorneyCity ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyCity),
      attorneyState:
        initialData?.attorneyState ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyState),
      attorneyZip:
        initialData?.attorneyZip ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyZip),
      attorneyPhone:
        initialData?.attorneyPhone ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyPhone),
      attorneyFax:
        initialData?.attorneyFax ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyFax) ||
        "",
      attorneyEmail:
        initialData?.attorneyEmail ||
        (isDIYUser ? "" : DEFAULT_ATTORNEY_INFO.attorneyEmail) ||
        "",
    },
  });

  // const hasAttorney = form.watch("hasAttorney");
  const formErrors = form.formState.errors;

  // Auto-submit for DIY users on mount (only once)
  useEffect(() => {
    if (isDIYUser && !initialData?.hasAttorney) {
      // Only auto-submit if we haven't saved data yet
      const values = form.getValues();
      onSubmit(values as Part13Attorney);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Auto-submit when form data changes (with validation) - only for LEGAL_REP users
  useEffect(() => {
    if (isDIYUser) return; // DIY users already submitted

    const subscription = form.watch((_value, { type }) => {
      // Only trigger on actual field changes, not on every render
      if (type !== "change") return;

      const values = form.getValues();
      // Only submit if hasAttorney is selected
      if (values.hasAttorney) {
        // If NO, submit immediately
        if (values.hasAttorney === "NO") {
          onSubmit(values as Part13Attorney);
        }
        // If YES, only submit when all required fields are filled
        else if (
          values.attorneyFirstName &&
          values.attorneyFirstName.trim().length > 0 &&
          values.attorneyLastName &&
          values.attorneyLastName.trim().length > 0 &&
          values.attorneyAddress &&
          values.attorneyAddress.trim().length > 0 &&
          values.attorneyCity &&
          values.attorneyCity.trim().length > 0 &&
          values.attorneyState &&
          values.attorneyState.trim().length > 0 &&
          values.attorneyZip &&
          values.attorneyZip.trim().length > 0 &&
          values.attorneyPhone &&
          values.attorneyPhone.trim().length > 0
        ) {
          onSubmit(values as Part13Attorney);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit, isDIYUser]);

  // Non-blocking submit for FormWizard navigation — saves partial data and always allows progression
  const handlePartialSubmit = useCallback(
    async (data: any) => {
      await onSubmit(data as Part13Attorney);
    },
    [onSubmit]
  );

  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      return new Promise<boolean>((resolve) => {
        form.handleSubmit(
          async (data) => {
            await handlePartialSubmit(data);
            resolve(true);
          },
          async () => {
            const formData = form.getValues();
            await handlePartialSubmit(formData);
            resolve(true); // Always allow progression
          }
        )();
      });
    };
    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, handlePartialSubmit]);

  // Render simplified form for DIY users
  if (isDIYUser) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sage-900">
              <Briefcase className="h-5 w-5 text-terracotta-500" />
              Part 13: Attorney Representation
            </CardTitle>
            <CardDescription>
              Confirmation of self-representation status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* DIY Service Confirmation */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-2 font-semibold text-blue-900">
                    DIY Document Preparation Service
                  </p>
                  <p className="text-sm text-blue-800">
                    You selected RadiantClaims' DIY service tier, which provides
                    document preparation assistance without legal
                    representation. You will be filing this claim on your own
                    behalf.
                  </p>
                </div>
              </div>
            </div>

            {/* Self-Representation Confirmation */}
            <div className="space-y-4">
              <FieldLabel
                importance="required"
                className="text-base font-semibold text-sage-900"
              >
                Self-Representation Confirmation
              </FieldLabel>

              <div className="rounded-md border-2 border-sage-300 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-600">
                    <span className="text-sm text-white">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 font-semibold text-sage-900">
                      Filing Without Attorney Representation
                    </p>
                    <p className="text-sm text-sage-700">
                      You have confirmed that you do not have an attorney
                      representing you for this RECA claim. All correspondence
                      from the RECA Program will be sent directly to you at the
                      address provided in Part 1 of this form.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="mb-2 font-semibold text-amber-900">
                    All Communications Will Come Directly to You
                  </p>
                  <p className="text-sm text-amber-800">
                    The RECA Program will send all correspondence, requests for
                    additional information, and claim decisions directly to the
                    mailing address you provided in Part 1. Make sure to check
                    your mail regularly and respond promptly to any requests.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-sage-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
              <div>
                <p className="text-sm text-sage-700">
                  <strong>Next Step:</strong> After completing this section, you
                  will move on to Part 16 where you will sign and certify your
                  RECA claim application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render full attorney information form for LEGAL_REP users
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Briefcase className="h-5 w-5 text-terracotta-500" />
            Part 13: Attorney Representation
          </CardTitle>
          <CardDescription>
            Legal representation included with your service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RadiantClaims Service Notice */}
          <div className="rounded-lg border border-terracotta-200 bg-terracotta-50 p-4">
            <div className="flex gap-3">
              <Briefcase className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
              <div>
                <p className="mb-2 font-semibold text-terracotta-900">
                  Attorney Representation Included with RadiantClaims Service
                </p>
                <p className="mb-2 text-sm text-terracotta-800">
                  By using RadiantClaims to prepare your RECA claim, you are
                  automatically working with our partner law firm for legal
                  representation. This is part of our service to help maximize
                  your chances of approval.
                </p>
                <p className="text-sm text-terracotta-800">
                  <strong>Important:</strong> The RECA Program will communicate
                  with your attorney on all matters related to your claim. You
                  will receive copies of all correspondence.
                </p>
              </div>
            </div>
          </div>

          {/* Attorney Fee Limits */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="mb-2 font-semibold text-amber-900">
                  Attorney Fee Limitations
                </p>
                <div className="space-y-2 text-sm text-amber-800">
                  <p>
                    <strong>2% for initial claims:</strong> If filing a new
                    claim for the first time
                  </p>
                  <p>
                    <strong>10% for resubmissions:</strong> If resubmitting a
                    previously denied claim OR if the representation contract
                    was made before July 10, 2000
                  </p>
                  <p className="mt-2">
                    These fee limits are set by federal law. Attorneys who
                    charge more than these amounts are subject to penalties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attorney Representation Status */}
          <div className="space-y-4">
            <FieldLabel
              importance="required"
              className="text-base font-semibold text-sage-900"
            >
              Attorney Representation Status
            </FieldLabel>

            <div className="rounded-md border-2 border-terracotta-300 bg-terracotta-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-600">
                  <Lock className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-terracotta-900">
                    ✓ Legal representation included with your RadiantClaims
                    service
                  </p>
                  <p className="mt-1 text-sm text-terracotta-700">
                    Our partner law firm will handle all legal aspects of your
                    RECA claim filing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attorney Information (Always Show Since hasAttorney is Always YES) */}
          <div className="space-y-6 border-l-2 border-terracotta-300 pl-4">
            <div>
              <h3 className="mb-2 text-base font-semibold text-sage-900">
                Partner Attorney Information
              </h3>
              <p className="mb-4 text-sm text-sage-600">
                The information below shows the partner law firm handling your
                RECA claim. This information will be included in your claim
                submission.
              </p>

              {formErrors.attorneyFirstName && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-800">
                      {formErrors.attorneyFirstName.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attorney Name */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyFirstName" importance="required">
                  First Name
                </FieldLabel>
                <Input
                  id="attorneyFirstName"
                  {...form.register("attorneyFirstName")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyLastName" importance="required">
                  Last Name
                </FieldLabel>
                <Input
                  id="attorneyLastName"
                  {...form.register("attorneyLastName")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                />
              </div>
            </div>

            {/* Firm */}
            <div className="space-y-2">
              <FieldLabel htmlFor="attorneyFirm" importance="optional">
                Law Firm
              </FieldLabel>
              <Input
                id="attorneyFirm"
                {...form.register("attorneyFirm")}
                disabled={!ATTORNEY_INFO_EDITABLE}
                className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <FieldLabel htmlFor="attorneyAddress" importance="required">
                Mailing Address
              </FieldLabel>
              <Input
                id="attorneyAddress"
                {...form.register("attorneyAddress")}
                disabled={!ATTORNEY_INFO_EDITABLE}
                className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyCity" importance="required">
                  City
                </FieldLabel>
                <Input
                  id="attorneyCity"
                  {...form.register("attorneyCity")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyState" importance="required">
                  State
                </FieldLabel>
                <select
                  id="attorneyState"
                  {...form.register("attorneyState")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : "bg-background"}`}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyZip" importance="required">
                  Zip Code
                </FieldLabel>
                <Input
                  id="attorneyZip"
                  {...form.register("attorneyZip")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                  maxLength={5}
                />
              </div>
            </div>

            {/* Phone and Fax */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyPhone" importance="required">
                  Phone Number
                </FieldLabel>
                <Input
                  id="attorneyPhone"
                  {...form.register("attorneyPhone")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="attorneyFax" importance="optional">
                  Fax Number
                </FieldLabel>
                <Input
                  id="attorneyFax"
                  {...form.register("attorneyFax")}
                  disabled={!ATTORNEY_INFO_EDITABLE}
                  className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                  type="tel"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <FieldLabel htmlFor="attorneyEmail" importance="optional">
                Email Address
              </FieldLabel>
              <Input
                id="attorneyEmail"
                {...form.register("attorneyEmail")}
                disabled={!ATTORNEY_INFO_EDITABLE}
                className={!ATTORNEY_INFO_EDITABLE ? "bg-sage-50" : ""}
                type="email"
              />
              {formErrors.attorneyEmail && (
                <p className="text-sm text-red-600">
                  {formErrors.attorneyEmail.message}
                </p>
              )}
            </div>

            {/* Note about attorney info */}
            {!ATTORNEY_INFO_EDITABLE && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-blue-900">
                      Attorney Information Pre-Configured
                    </p>
                    <p className="text-sm text-blue-800">
                      This information is managed by RadiantClaims and our
                      partner law firm. If you need to update any details,
                      please contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Communication Notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="mb-1 text-sm font-semibold text-amber-900">
                    All Communications Will Go to Your Attorney
                  </p>
                  <p className="text-sm text-amber-800">
                    The RECA Program will send all correspondence, updates, and
                    decisions to your attorney's address. RadiantClaims and the
                    partner law firm will keep you informed throughout the
                    process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Step:</strong> After completing this section, you
                will move on to Part 14 where the partner attorney will sign an
                acknowledgment of the 2% fee limitation under RECA for initial
                claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
