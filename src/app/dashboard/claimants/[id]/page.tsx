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
import { FileText } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">RadiantClaims</h1>
            <p className="text-sm text-muted-foreground">Claimant Details</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {claimant.firstName} {claimant.lastName}
              </CardTitle>
              <CardDescription>Claimant Information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Contact Information
                </h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium">Email</dt>
                    <dd className="text-sm text-muted-foreground">
                      {claimant.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">Phone</dt>
                    <dd className="text-sm text-muted-foreground">
                      {claimant.phone}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">Date of Birth</dt>
                    <dd className="text-sm text-muted-foreground">
                      {new Date(claimant.dob).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Address
                </h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium">Street</dt>
                    <dd className="text-sm text-muted-foreground">
                      {claimant.address1}
                      {claimant.address2 && <>, {claimant.address2}</>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">City, State ZIP</dt>
                    <dd className="text-sm text-muted-foreground">
                      {claimant.city}, {claimant.state} {claimant.postalCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">County</dt>
                    <dd className="text-sm text-muted-foreground">
                      {claimant.county}
                    </dd>
                  </div>
                </dl>
              </div>

              {claimant.referral && (
                <div className="md:col-span-2">
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                    Referral Information
                  </h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium">Referrer</dt>
                      <dd className="text-sm text-muted-foreground">
                        {claimant.referral.referrerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Referral Code</dt>
                      <dd className="text-sm text-muted-foreground">
                        {claimant.referral.code}
                      </dd>
                    </div>
                    {claimant.referral.contact && (
                      <div>
                        <dt className="text-sm font-medium">Contact</dt>
                        <dd className="text-sm text-muted-foreground">
                          {claimant.referral.contact}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div className="md:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Metadata
                </h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium">Created</dt>
                    <dd className="text-sm text-muted-foreground">
                      {new Date(claimant.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium">Last Updated</dt>
                    <dd className="text-sm text-muted-foreground">
                      {new Date(claimant.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Uploaded documents for this claimant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimant.documents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {claimant.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{doc.originalName}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.type} • {(doc.size / 1024).toFixed(2)} KB •{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Key: {doc.fileKey}
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
