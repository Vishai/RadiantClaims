import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, Info, X } from "lucide-react";
import SurvivorHierarchyTable from "@/components/reca/SurvivorHierarchyTable";

export default function EligibilityPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-cream-50">
        <nav className="sticky top-0 z-50 border-b border-cream-200 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between p-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
                <Heart className="h-5 w-5 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-sage-800">
                RadiantClaims
              </span>
            </Link>
            <Link href="/service-tiers">
              <Button className="rounded-full bg-terracotta-500 px-8 py-6 hover:bg-terracotta-600">
                Choose Your Path
              </Button>
            </Link>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-12">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-sage-900">
                RECA Eligibility Requirements
              </h1>
              <p className="text-xl text-sage-700">
                Find out if you or a family member qualifies for the $100,000
                federal compensation
              </p>
              <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
            </div>

            {/* Quick Summary */}
            <Card className="mb-8 rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-sage-900">
                  Quick Eligibility Check
                </CardTitle>
                <CardDescription className="text-sage-600">
                  You may qualify if all three criteria are met
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    1
                  </div>
                  <div className="text-sage-800">
                    <strong>Presence:</strong> Lived in UT, ID, NM, AZ, or NV
                    for at least 1 year between January 21, 1951 - November 6,
                    1962 (or the full month of July 1962)
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    2
                  </div>
                  <div className="text-sage-800">
                    <strong>Disease:</strong> Diagnosed with a covered primary
                    cancer from the DOJ's specified list
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sage-600 text-lg font-bold text-white">
                    3
                  </div>
                  <div className="text-sage-800">
                    <strong>Latency:</strong> Cancer appeared at least 5 years
                    after first exposure (2 years for leukemia)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Requirements */}
            <div className="space-y-8">
              {/* Presence Requirement */}
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    1. Presence Requirement
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Where and when you (or your family member) lived
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="mb-4 font-semibold text-sage-900">
                    Covered States (2025 Expansion):
                  </h3>
                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-xs text-white">
                        ✓
                      </div>
                      <span className="text-sage-800">All of Utah</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-xs text-white">
                        ✓
                      </div>
                      <span className="text-sage-800">All of Idaho</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-xs text-white">
                        ✓
                      </div>
                      <span className="text-sage-800">All of New Mexico</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-xs text-white">
                        ✓
                      </div>
                      <span className="text-sage-800">
                        Specified counties in Arizona
                      </span>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button className="cursor-help text-terracotta-500 transition-all duration-200 hover:scale-110 hover:text-terracotta-700">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white shadow-lg">
                          <p className="mb-1 font-semibold text-sage-900">
                            Arizona Counties:
                          </p>
                          <p className="text-sm text-sage-700">
                            Apache, Coconino, Gila, Mohave, Navajo, and Yavapai
                          </p>
                          <p className="mt-1 text-xs italic text-sage-600">
                            Plus the part of Arizona north of the Grand Canyon
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-xs text-white">
                        ✓
                      </div>
                      <span className="text-sage-800">
                        Specified counties in Nevada
                      </span>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button className="cursor-help text-terracotta-500 transition-all duration-200 hover:scale-110 hover:text-terracotta-700">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm bg-white shadow-lg">
                          <p className="mb-1 font-semibold text-sage-900">
                            Nevada Counties:
                          </p>
                          <p className="text-sm text-sage-700">
                            Eureka, Lander, Lincoln, Nye, and White Pine
                          </p>
                          <p className="mt-1 text-xs italic text-sage-600">
                            Plus Clark County (partial): townships 13-16, ranges
                            63-71
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <h3 className="mb-4 font-semibold text-sage-900">
                    Time Period:
                  </h3>
                  <ul className="ml-6 list-disc space-y-2 text-sage-700">
                    <li>
                      <strong>Standard:</strong> At least 1 full year of
                      residence between January 21, 1951 and November 6, 1962,
                      OR
                    </li>
                    <li>
                      <strong>Alternate:</strong> The entire month of July 1962
                    </li>
                    <li>
                      <strong>New Mexico specific:</strong> At least 1 year
                      between September 24, 1944 and November 6, 1962 (Manhattan
                      Project era)
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Disease Requirement */}
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    2. Covered Cancers
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Primary cancers recognized by the Department of Justice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-sage-600">
                    The following primary cancers qualify (must be the original
                    site, not metastatic):
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-50 p-4">
                      <h4 className="mb-3 font-semibold text-sage-900">
                        Blood & Lymph:
                      </h4>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-sage-700">
                        <li>Leukemia (except chronic lymphocytic)</li>
                        <li>Lymphoma (all types)</li>
                        <li>Multiple myeloma</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-peach-50 to-cream-50 p-4">
                      <h4 className="mb-3 font-semibold text-sage-900">
                        Solid Tumors:
                      </h4>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-sage-700">
                        <li>Thyroid cancer</li>
                        <li>Breast cancer</li>
                        <li>Lung cancer</li>
                        <li>Esophagus</li>
                        <li>Stomach</li>
                        <li>Pharynx</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-cream-100 to-peach-50 p-4">
                      <h4 className="mb-3 font-semibold text-sage-900">
                        Digestive:
                      </h4>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-sage-700">
                        <li>Colon cancer</li>
                        <li>Pancreas</li>
                        <li>Bile ducts</li>
                        <li>Gall bladder</li>
                        <li>Small intestine</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-terracotta-50 to-peach-50 p-4">
                      <h4 className="mb-3 font-semibold text-sage-900">
                        Other:
                      </h4>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-sage-700">
                        <li>Brain cancer</li>
                        <li>Liver (except cirrhosis/hepatitis)</li>
                        <li>Salivary gland</li>
                        <li>Urinary tract (bladder, kidney)</li>
                        <li>Ovary</li>
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-sage-600">
                    <strong>Note:</strong> This is not a complete list. See the
                    DOJ RECA website for the full list of covered cancers.
                  </p>
                </CardContent>
              </Card>

              {/* Latency Requirement */}
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    3. Latency Period
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Time between exposure and cancer diagnosis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-terracotta-50 to-peach-50 p-6">
                      <h4 className="mb-2 font-semibold text-terracotta-900">
                        For Leukemia:
                      </h4>
                      <p className="text-sm text-sage-700">
                        Must be diagnosed at least <strong>2 years</strong>{" "}
                        after the date the person was first exposed (last date
                        of residence in affected area).
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6">
                      <h4 className="mb-2 font-semibold text-sage-900">
                        For All Other Cancers:
                      </h4>
                      <p className="text-sm text-sage-700">
                        Must be diagnosed at least <strong>5 years</strong>{" "}
                        after the date the person was first exposed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filing for Deceased */}
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Can I File for a Deceased Family Member?
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Yes! Survivors can file on behalf of eligible individuals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sage-700">
                    If your loved one was diagnosed with a covered cancer and
                    has since passed away, eligible survivors can file and
                    receive the compensation.
                  </p>

                  {/* Eligible Survivors */}
                  <div className="mb-6">
                    <p className="mb-3 font-semibold text-sage-900">
                      ✓ Eligible to File:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </div>
                        <span className="text-sage-800">Surviving spouse</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </div>
                        <span className="text-sage-800">
                          Children (biological or legally adopted)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </div>
                        <span className="text-sage-800">Parents</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </div>
                        <span className="text-sage-800">Grandchildren</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </div>
                        <span className="text-sage-800">Grandparents</span>
                      </div>
                    </div>
                  </div>

                  {/* Ineligible Survivors */}
                  <div className="mb-6">
                    <p className="mb-3 font-semibold text-sage-900">
                      ✗ NOT Eligible to File:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                          <X className="h-4 w-4" />
                        </div>
                        <span className="text-sage-800">
                          Siblings (brothers/sisters)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                          <X className="h-4 w-4" />
                        </div>
                        <span className="text-sage-800">
                          Step-children (without legal adoption)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                          <X className="h-4 w-4" />
                        </div>
                        <span className="text-sage-800">
                          Former spouses (ex-spouses)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="space-y-4">
                    <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
                        <div className="text-sm text-sage-700">
                          <p className="mb-2 font-semibold">
                            Important for Children Filing Claims:
                          </p>
                          <ul className="ml-4 list-disc space-y-1">
                            <li>
                              All siblings must be disclosed and documented
                            </li>
                            <li>
                              If a sibling has passed away, their death
                              certificate must be included
                            </li>
                            <li>
                              The $100,000 award is shared equally among all
                              eligible children
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                        <div className="text-sm text-blue-700">
                          <p className="mb-2 font-semibold">
                            About Adopted Children:
                          </p>
                          <p>
                            Legally adopted children <strong>can file</strong>{" "}
                            if they have valid adoption paperwork. Step-children
                            without legal adoption papers are{" "}
                            <strong>not eligible</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-sage-600">
                    You'll need death certificates and proof of your
                    relationship to the deceased claimant.
                  </p>
                </CardContent>
              </Card>

              {/* What You'll Need */}
              <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Documents You'll Need to Gather
                  </CardTitle>
                  <CardDescription className="text-sage-600">
                    Start collecting these now to speed up your claim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold text-sage-900">
                        Proof of Residence (need 2+ sources):
                      </h4>
                      <ul className="ml-6 list-disc space-y-1 text-sm text-sage-700">
                        <li>School records or yearbooks</li>
                        <li>Employment or tax records</li>
                        <li>Church membership records (often fastest!)</li>
                        <li>Utility bills or letters with postmarks</li>
                        <li>
                          Marriage or birth certificates listing residence
                        </li>
                        <li>Voting or military registration</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-sage-900">
                        Medical Proof:
                      </h4>
                      <ul className="ml-6 list-disc space-y-1 text-sm text-sage-700">
                        <li>Pathology report (preferred)</li>
                        <li>Hospital discharge summary</li>
                        <li>Oncologist letter or summary</li>
                        <li>
                          Death certificate (if applicable, must list cancer as
                          cause)
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-sage-900">
                        Identity Documents:
                      </h4>
                      <ul className="ml-6 list-disc space-y-1 text-sm text-sage-700">
                        <li>Birth certificate</li>
                        <li>Marriage certificate (if applicable)</li>
                        <li>
                          For deceased: family relationship proof
                          (birth/marriage certificates)
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Survivor Hierarchy Section */}
            <div className="mt-12">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold text-sage-900">
                  Filing on Behalf of a Deceased Individual?
                </h2>
                <p className="text-lg text-sage-700">
                  Understand the survivor payment hierarchy and eligibility
                  requirements
                </p>
                <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
              </div>

              <SurvivorHierarchyTable />
            </div>

            {/* CTA Section */}
            <div className="mt-12 rounded-3xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 p-8 text-center text-white shadow-lg">
              <h2 className="mb-4 text-3xl font-bold">
                Think You Might Qualify?
              </h2>
              <p className="mb-6 text-lg text-terracotta-50">
                Choose your path: DIY document preparation or full legal
                representation with Heritage Law Offices.
              </p>
              <Link href="/service-tiers">
                <Button
                  size="lg"
                  className="rounded-full bg-white px-8 py-6 text-lg font-semibold text-terracotta-600 hover:bg-cream-50"
                >
                  Choose Your Path →
                </Button>
              </Link>
              <p className="mt-4 text-sm text-terracotta-100">
                DIY: $499 One-time • Legal: $0 Upfront + 2% attorney fee (paid
                only if you win)
              </p>
            </div>
          </div>
        </main>

        <footer className="mt-20 border-t border-cream-200 bg-white py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
                  <Heart className="h-4 w-4 text-white" fill="white" />
                </div>
                <span className="font-semibold text-sage-800">
                  RadiantClaims
                </span>
              </div>
              <p className="text-sm text-sage-600">
                &copy; 2024 RadiantClaims. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <Link
                  href={"/terms" as any}
                  className="text-sage-600 transition-colors hover:text-terracotta-600"
                >
                  Terms of Service
                </Link>
                <Link
                  href={"/privacy" as any}
                  className="text-sage-600 transition-colors hover:text-terracotta-600"
                >
                  Privacy Policy
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
    </TooltipProvider>
  );
}
