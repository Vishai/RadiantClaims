import { Suspense } from "react";
import Link from "next/link";
import { ResourceFinder } from "@/components/resources/ResourceFinder";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, FileText, Building2, Hospital } from "lucide-react";

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

        {/* Help Section */}
        <div className="mt-12 rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-cream-50 to-white p-8">
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
