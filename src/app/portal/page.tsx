"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Key,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface Claimant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  claimType?: string;
  intakeSession: {
    id: string;
    resumeToken: string;
    currentStep: string;
    status: string;
    uploadedFiles: any[];
    packetSubmission: any | null;
    recaWorkflowStage?: number | null;
    recaWorkflowSection?: string | null;
    recaCompletionPercent?: number | null;
  } | null;
}

export default function CustomerPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/portal");
    } else if (status === "authenticated") {
      loadClaims();
    }
  }, [status, router]);

  const loadClaims = async () => {
    try {
      const response = await fetch("/api/portal/claims");
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error("Failed to load claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: any }
    > = {
      DRAFT: {
        label: "Draft",
        className: "bg-sage-100 text-sage-700 border-sage-200",
        icon: Clock,
      },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      },
      READY_FOR_REVIEW: {
        label: "Ready for Review",
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: AlertCircle,
      },
      UNDER_REVIEW: {
        label: "Under Review",
        className: "bg-purple-100 text-purple-700 border-purple-200",
        icon: Clock,
      },
      APPROVED: {
        label: "Approved",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      },
      SUBMITTED: {
        label: "Submitted",
        className:
          "bg-terracotta-100 text-terracotta-700 border-terracotta-200",
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config?.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config?.className || ""}`}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {config?.label}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Navigation */}
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
          <div className="flex items-center gap-4">
            <span className="text-sm text-sage-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/portal/change-password")}
              className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              <Key className="h-4 w-4" />
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/api/auth/signout")}
              className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-sage-900">My Claims</h1>
          <p className="text-lg text-sage-700">
            Track your RECA claims and manage your documents
          </p>
        </div>

        {/* Claims List */}
        {claims.length === 0 ? (
          <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-16 w-16 text-sage-300" />
              <h3 className="mb-2 text-xl font-semibold text-sage-900">
                No claims yet
              </h3>
              <p className="mb-6 text-center text-sage-600">
                Start your free claim packet to begin the process
              </p>
              <Button
                onClick={() => router.push("/intake")}
                className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                <Plus className="h-4 w-4" />
                Start New Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {claims.map((claim) => (
              <Card
                key={claim.id}
                className="overflow-hidden rounded-3xl border-2 border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sage-900">
                        {claim.firstName} {claim.lastName}
                      </CardTitle>
                      <CardDescription className="text-sage-600">
                        Started on{" "}
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {claim.intakeSession &&
                      getStatusBadge(claim.intakeSession.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Info */}
                    {claim.intakeSession && (
                      <div className="rounded-2xl bg-cream-50 p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-sage-700">
                            Current Step
                          </span>
                          <span className="text-sage-900">
                            {claim.intakeSession.currentStep.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-sage-700">
                            Documents Uploaded
                          </span>
                          <span className="text-sage-900">
                            {claim.intakeSession.uploadedFiles.length}
                          </span>
                        </div>
                        {claim.intakeSession.packetSubmission && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-sage-700">
                              Packet Status
                            </span>
                            <span className="text-sage-900">
                              {claim.intakeSession.packetSubmission.status}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {claim.intakeSession &&
                        claim.intakeSession?.status !== "SUBMITTED" && (
                          <>
                            {/* RECA Form Button - Show if DOWNWINDER claim type */}
                            {claim.claimType === "DOWNWINDER" && (
                              <Button
                                onClick={() =>
                                  router.push(
                                    claim.intakeSession?.recaWorkflowStage
                                      ? `/reca/form/${claim.intakeSession.id}?section=${claim.intakeSession.recaWorkflowSection || "part_1"}`
                                      : `/reca/start?sessionId=${claim.intakeSession?.id}`
                                  )
                                }
                                className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                              >
                                <FileText className="h-4 w-4" />
                                {claim.intakeSession?.recaWorkflowStage
                                  ? "Continue RECA Form"
                                  : "Fill RECA Form"}
                              </Button>
                            )}
                            {/* Regular Continue Button - Show for non-DOWNWINDER or as secondary */}
                            {claim.claimType !== "DOWNWINDER" && (
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/intake/step2?token=${claim.intakeSession?.resumeToken || ""}`
                                  )
                                }
                                className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
                              >
                                Continue Claim
                              </Button>
                            )}
                          </>
                        )}
                      <Button
                        variant="outline"
                        onClick={() => router.push("/portal/documents")}
                        className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                      >
                        <Upload className="h-4 w-4" />
                        Manage Documents
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/portal/claim/${claim.id}` as any)
                        }
                        className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Claim */}
            <Button
              onClick={() => router.push("/intake")}
              variant="outline"
              className="w-full gap-2 rounded-full border-2 border-dashed border-sage-300 py-6 text-sage-700 hover:border-terracotta-400 hover:bg-terracotta-50 hover:text-terracotta-700"
            >
              <Plus className="h-5 w-5" />
              Start Another Claim
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
