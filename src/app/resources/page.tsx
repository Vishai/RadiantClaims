import { Suspense } from "react";
import Link from "next/link";
import { ResourceFinder } from "@/components/resources/ResourceFinder";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ArrowLeft,
  FileText,
  Building2,
  Hospital,
  Church,
} from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
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
          <div className="flex gap-3">
            <Link href="/portal">
              <Button
                variant="outline"
                className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            Document Resources
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-sage-700">
            Find government offices, hospitals, and vital records departments to
            obtain documents for your RECA claim.
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/resources?documentType=BIRTH_CERTIFICATE"
            className="block"
          >
            <div className="cursor-pointer rounded-2xl border-2 border-sage-200 bg-white p-6 transition-all hover:border-sage-300 hover:shadow-md">
              <FileText className="mb-3 h-8 w-8 text-terracotta-500" />
              <h3 className="mb-2 font-semibold text-sage-900">
                Birth Certificates
              </h3>
              <p className="text-sm text-sage-600">
                Find vital records offices
              </p>
            </div>
          </Link>

          <Link
            href="/resources?documentType=MEDICAL_RECORDS"
            className="block"
          >
            <div className="cursor-pointer rounded-2xl border-2 border-sage-200 bg-white p-6 transition-all hover:border-sage-300 hover:shadow-md">
              <Hospital className="mb-3 h-8 w-8 text-terracotta-500" />
              <h3 className="mb-2 font-semibold text-sage-900">
                Medical Records
              </h3>
              <p className="text-sm text-sage-600">
                Find hospitals and registries
              </p>
            </div>
          </Link>

          <Link
            href="/resources?documentType=PROPERTY_RECORDS"
            className="block"
          >
            <div className="cursor-pointer rounded-2xl border-2 border-sage-200 bg-white p-6 transition-all hover:border-sage-300 hover:shadow-md">
              <Building2 className="mb-3 h-8 w-8 text-terracotta-500" />
              <h3 className="mb-2 font-semibold text-sage-900">
                Property Records
              </h3>
              <p className="text-sm text-sage-600">Find county recorders</p>
            </div>
          </Link>
        </div>

        {/* Resource Finder Component */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-terracotta-500 border-r-transparent"></div>
                <p className="mt-4 text-sage-600">Loading resource finder...</p>
              </div>
            </div>
          }
        >
          <ResourceFinder />
        </Suspense>

        {/* LDS Church Records Info */}
        <div className="mt-12 rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Church className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold text-sage-900">
                LDS Church Records for Proof of Residence
              </h2>
              <div className="space-y-3 text-sage-700">
                <p>
                  <strong>For LDS Church Members:</strong> If you were a member
                  of The Church of Jesus Christ of Latter-day Saints during the
                  relevant time period, the Church's Member and Statistical
                  Records Division maintains historical records that can help
                  establish proof of presence in affected areas.
                </p>
                <p className="text-sm">
                  <strong>What records they have:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm">
                  <li>
                    Membership records showing ward/branch assignments and
                    geographic location
                  </li>
                  <li>
                    Baptism and confirmation records with dates and locations
                  </li>
                  <li>Historical ward and stake directories</li>
                  <li>Other vital records maintained by the Church</li>
                </ul>
                <div className="mt-4 rounded-lg border-2 border-purple-300 bg-purple-50 p-4">
                  <p className="mb-2 text-sm font-bold text-purple-900">
                    📞 Contact Information:
                  </p>
                  <div className="space-y-1 text-sm text-purple-900">
                    <p>
                      <strong>Phone:</strong> (801) 240-3500
                    </p>
                    <p>
                      <strong>Address:</strong>
                    </p>
                    <p className="ml-4">
                      Member and Statistical Records Division
                      <br />
                      17th Floor
                      <br />
                      50 East North Temple Street
                      <br />
                      Salt Lake City, UT 84150
                    </p>
                  </div>
                </div>
                <p className="text-sm">
                  <strong>When filling out your RECA form:</strong> In Part 9
                  (Proof of Presence), you can check a box indicating you've
                  contacted the Church regarding your claim. The Church can
                  provide records directly to support your documentation
                  requirements.
                </p>
                <p className="text-sm text-sage-600">
                  <em>
                    Note: This is especially helpful for claimants in Utah,
                    Nevada, Arizona, and Idaho where LDS Church membership was
                    common during the nuclear testing period.
                  </em>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancer Registry Authorization Info */}
        <div className="mt-8 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Hospital className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-2xl font-bold text-sage-900">
                Let the Department of Justice Get Your Medical Records
              </h2>
              <div className="space-y-3 text-sage-700">
                <p>
                  <strong>Good news:</strong> When filling out your RECA form,
                  you can authorize the Department of Justice to obtain your
                  medical records directly from your state's cancer registry on
                  your behalf.
                </p>
                <p className="text-sm">
                  <strong>How it works:</strong>
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm">
                  <li>
                    During the RECA form (Part 11), check the cancer registry
                    authorization box
                  </li>
                  <li>
                    Complete the "Authorization to Release Medical Information"
                    supporting form
                  </li>
                  <li>
                    The DOJ will request your records directly from the state
                    cancer registry
                  </li>
                  <li>
                    This process is between you and the government —
                    RadiantClaims is not involved
                  </li>
                </ul>
                <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-900">
                    ⏱️ <strong>Processing Time:</strong> While this
                    authorization may add some time to your claim processing,
                    the Department of Justice may be more effective at obtaining
                    records than individuals, especially for older or
                    hard-to-locate medical records.
                  </p>
                </div>
                <p className="text-sm">
                  <strong>When to use this option:</strong> Consider using this
                  authorization if you're having difficulty obtaining medical
                  records yourself, if records are very old, or if the treating
                  facility is closed or unresponsive.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-cream-50 to-white p-8">
          <h2 className="mb-4 text-2xl font-bold text-sage-900">
            Need Help Finding Documents?
          </h2>
          <div className="space-y-4 text-sage-700">
            <p>
              <strong>Birth/Death Certificates:</strong> Start with your state's
              vital records office. For older records (before 1950), check state
              archives.
            </p>
            <p>
              <strong>Medical Records:</strong> Contact the hospital where
              treatment occurred. If closed, check your state's cancer registry
              or health department.
            </p>
            <p>
              <strong>Proof of Residence:</strong> County recorders have
              property records, tax assessors have tax records, and school
              districts keep attendance records.
            </p>
            <p>
              <strong>Can't Find a Resource?</strong> Consider upgrading to our
              Legal Representation path where Heritage Law Offices can help
              obtain hard-to-find documents.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/service-tiers">
              <Button className="rounded-full bg-terracotta-500 text-white hover:bg-terracotta-600">
                Learn About Legal Representation
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
