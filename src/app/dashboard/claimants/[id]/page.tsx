import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Heart, ArrowLeft } from "lucide-react";
import { formatISODateForDisplay } from "@/lib/date-utils";

export default async function ClaimantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/login");
  }

  const claimant = await db.claimant.findUnique({
    where: { id: params.id },
    include: {
      referral: true,
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!claimant) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sage-800">
                RadiantClaims
              </h1>
              <p className="text-xs text-sage-600">Claimant Details</p>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-sage-900">
            {claimant.firstName} {claimant.lastName}
          </h2>
          <p className="text-sage-600">Claimant record details</p>
          <div className="mt-2 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        <div className="grid gap-8">
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sage-900">
                Personal Information
              </CardTitle>
              <CardDescription className="text-sage-600">
                Contact and address details
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-sage-50 to-cream-50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-sage-900">
                  Contact Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-sage-600">Email</dt>
                    <dd className="text-sm text-sage-900">{claimant.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sage-600">Phone</dt>
                    <dd className="text-sm text-sage-900">{claimant.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      Date of Birth
                    </dt>
                    <dd className="text-sm text-sage-900">
                      {formatISODateForDisplay(claimant.dob)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-peach-50 to-cream-50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-sage-900">
                  Address
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      Street
                    </dt>
                    <dd className="text-sm text-sage-900">
                      {claimant.address1}
                      {claimant.address2 && <>, {claimant.address2}</>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      City, State ZIP
                    </dt>
                    <dd className="text-sm text-sage-900">
                      {claimant.city}, {claimant.state} {claimant.postalCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      County
                    </dt>
                    <dd className="text-sm text-sage-900">{claimant.county}</dd>
                  </div>
                </dl>
              </div>

              {claimant.referral && (
                <div className="rounded-2xl bg-gradient-to-br from-terracotta-50 to-peach-50 p-6 md:col-span-2">
                  <h3 className="mb-4 text-sm font-semibold text-sage-900">
                    Referral Information
                  </h3>
                  <dl className="grid gap-4 md:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-sage-600">
                        Referrer
                      </dt>
                      <dd className="text-sm text-sage-900">
                        {claimant.referral.referrerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-sage-600">
                        Referral Code
                      </dt>
                      <dd className="font-mono text-sm text-sage-900">
                        {claimant.referral.code}
                      </dd>
                    </div>
                    {claimant.referral.contact && (
                      <div>
                        <dt className="text-xs font-medium text-sage-600">
                          Contact
                        </dt>
                        <dd className="text-sm text-sage-900">
                          {claimant.referral.contact}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-cream-100 to-cream-50 p-6 md:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-sage-900">
                  Metadata
                </h3>
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      Created
                    </dt>
                    <dd className="text-sm text-sage-900">
                      {new Date(claimant.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-sage-600">
                      Last Updated
                    </dt>
                    <dd className="text-sm text-sage-900">
                      {new Date(claimant.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sage-900">Documents</CardTitle>
              <CardDescription className="text-sage-600">
                Uploaded documents for this claimant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimant.documents.length === 0 ? (
                <p className="py-8 text-center text-sm text-sage-600">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {claimant.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-2xl border-2 border-cream-200 bg-gradient-to-r from-white to-cream-50 p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-100">
                          <FileText className="h-5 w-5 text-terracotta-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sage-900">
                            {doc.originalName}
                          </p>
                          <p className="text-xs text-sage-600">
                            <span className="inline-flex items-center rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-800">
                              {doc.type}
                            </span>
                            {" • "}
                            {(doc.size / 1024).toFixed(2)} KB
                            {" • "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="hidden text-xs text-sage-500 md:block">
                        {doc.fileKey}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
