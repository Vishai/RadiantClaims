"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Heart,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Phone,
  HelpCircle,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentDashboard } from "@/components/documents/DocumentDashboard";
import {
  generateDocumentRequirements,
  calculateSubmissionReadiness,
  getDocumentAssistance,
  type DocumentRequirement,
} from "@/lib/reca/document-tracking";
import type { RelationshipType } from "@/lib/reca/types";

// ---------- helpers ----------

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    identity: "Identity & Vital Records",
    relationship: "Relationship Proof",
    medical: "Medical Documentation",
    presence: "Proof of Presence",
    legal: "Legal & Name Changes",
  };
  return map[cat] || cat;
}

function statusBadge(status: string) {
  switch (status) {
    case "verified":
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          Verified
        </span>
      );
    case "uploaded":
      return (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          Uploaded
        </span>
      );
    case "confirmed":
      return (
        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-700">
          Confirmed
        </span>
      );
    case "in_progress":
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          In Progress
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
          Needed
        </span>
      );
  }
}

// ---------- component ----------

export default function SessionDocumentsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Session & form data
  const [, setClaimType] = useState<string | undefined>();
  const [formData, setFormData] = useState<any>(null);
  const [claimantName, setClaimantName] = useState<string>("");

  // Requirements derived from document-tracking.ts
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);

  // Help panel
  const [helpDocId, setHelpDocId] = useState<string | null>(null);

  // ------- data loading -------

  const loadSessionData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch the claims list to find this session's metadata
      const res = await fetch("/api/portal/claims");
      if (!res.ok) return;
      const data = await res.json();
      const claims = data.claims || [];

      // Find claim with matching session
      const claim = claims.find((c: any) => c.intakeSession?.id === sessionId);
      if (!claim) return;

      const fd = claim.intakeSession?.recaFormData ?? {};
      setFormData(fd);
      setClaimType(claim.claimType);
      setClaimantName(
        claim.firstName === "Pending"
          ? "Your Claim"
          : `${claim.firstName} ${claim.lastName}`
      );

      // Determine relationship for requirement generation
      const relationship: RelationshipType = fd.part_3?.relationship || "Self";

      const reqs = generateDocumentRequirements(
        relationship,
        fd.part_1,
        fd.part_4
      );
      setRequirements(reqs);
    } catch (err) {
      console.error("Failed to load session data:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/reca/documents/${sessionId}`);
    } else if (authStatus === "authenticated") {
      void loadSessionData();
    }
  }, [authStatus, router, sessionId, loadSessionData]);

  // ------- derived data -------

  const readiness = useMemo(
    () => calculateSubmissionReadiness(requirements),
    [requirements]
  );

  const groupedRequirements = useMemo(() => {
    const groups: Record<string, DocumentRequirement[]> = {};
    for (const req of requirements) {
      const cat = req.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(req);
    }
    return groups;
  }, [requirements]);

  const helpResources = useMemo(() => {
    if (!helpDocId) return null;
    return getDocumentAssistance(helpDocId);
  }, [helpDocId]);

  // ------- handlers -------

  const handleUploadComplete = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // ------- render -------

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent" />
          <p className="text-sage-700">Loading documents…</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Nav name={session?.user?.name || session?.user?.email} />
        <main className="container mx-auto max-w-4xl px-6 py-12">
          <Card className="rounded-3xl border-2 border-cream-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="mb-4 h-16 w-16 text-sage-300" />
              <h3 className="mb-2 text-xl font-semibold text-sage-900">
                Session Not Found
              </h3>
              <p className="mb-6 text-center text-sage-600">
                We couldn&apos;t find a claim for this session. It may have been
                deleted or the link is incorrect.
              </p>
              <Button
                onClick={() => router.push("/portal")}
                className="rounded-full bg-terracotta-500 hover:bg-terracotta-600"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Nav name={session?.user?.name || session?.user?.email} />

      <main className="container mx-auto max-w-7xl px-6 py-12">
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => router.push("/portal")}
          className="mb-6 gap-2 text-sage-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold text-sage-900">
            Documents — {claimantName}
          </h1>
          <p className="text-sage-600">
            Upload, track, and organize the supporting documents for this claim.
          </p>
        </div>

        {/* Main Grid: 2/3 content + 1/3 sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ---- LEFT: upload + file list ---- */}
          <div className="space-y-8 lg:col-span-2">
            {/* Upload Zone */}
            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload PDFs or images of your documents. Max 10 MB per file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUploadZone
                  sessionId={sessionId}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(err) => alert(err)}
                />
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  View, download, or manage documents you&apos;ve uploaded for
                  this claim.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentDashboard
                  key={refreshKey}
                  sessionId={sessionId}
                  onRefresh={handleRefresh}
                />
              </CardContent>
            </Card>
          </div>

          {/* ---- RIGHT: sidebar ---- */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="rounded-3xl border-2 border-cream-200 bg-gradient-to-br from-sage-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-sage-600" />
                  Document Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-sage-700">
                      Completeness
                    </span>
                    <span className="font-semibold text-sage-900">
                      {readiness.percentage}%
                    </span>
                  </div>
                  <Progress value={readiness.percentage} className="h-2" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sage-700">Total Required</span>
                    <span className="font-medium text-sage-900">
                      {requirements.filter((r) => r.required).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sage-700">Confirmed / Uploaded</span>
                    <span className="font-medium text-emerald-700">
                      {
                        requirements.filter(
                          (r) =>
                            r.status === "confirmed" ||
                            r.status === "uploaded" ||
                            r.status === "verified"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sage-700">Still Needed</span>
                    <span className="font-medium text-amber-700">
                      {readiness.missingRequired.length}
                    </span>
                  </div>
                </div>

                {readiness.canSubmit && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center">
                    <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      All required documents accounted for
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements Checklist */}
            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle className="text-base">Required Documents</CardTitle>
                <CardDescription>
                  Based on your claim type and relationship info.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(groupedRequirements).map(([category, reqs]) => (
                  <div key={category}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage-500">
                      {categoryLabel(category)}
                    </h4>
                    <div className="space-y-2">
                      {reqs.map((req) => {
                        const resolved =
                          req.status === "confirmed" ||
                          req.status === "uploaded" ||
                          req.status === "verified";

                        return (
                          <div
                            key={req.id}
                            className={`rounded-lg border-2 p-3 transition-colors ${
                              resolved
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-sage-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {resolved ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                              ) : (
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-sage-900">
                                    {req.name}
                                    {req.quantity && req.quantity > 1 && (
                                      <span className="ml-1 text-xs text-sage-500">
                                        ×{req.quantity}
                                      </span>
                                    )}
                                  </p>
                                  {statusBadge(req.status)}
                                </div>
                                <p className="mt-0.5 text-xs text-sage-600">
                                  {req.description}
                                </p>

                                {/* Help button */}
                                {!resolved && (
                                  <button
                                    onClick={() =>
                                      setHelpDocId(
                                        helpDocId === req.id ? null : req.id
                                      )
                                    }
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-terracotta-600 hover:text-terracotta-700"
                                  >
                                    <HelpCircle className="h-3 w-3" />
                                    How do I get this?
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Inline help resources */}
                            {helpDocId === req.id && helpResources && (
                              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p className="mb-2 text-xs font-semibold text-blue-900">
                                  Resources for {req.name}:
                                </p>
                                <ul className="space-y-1.5">
                                  {helpResources.resources.map(
                                    (resource, i) => (
                                      <li key={i} className="text-xs">
                                        <span className="font-medium text-blue-900">
                                          {resource.title}
                                        </span>
                                        <span className="block text-blue-700">
                                          {resource.description}
                                        </span>
                                        {resource.url &&
                                          resource.url !== "#" && (
                                            <a
                                              href={resource.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-0.5 inline-flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Visit
                                            </a>
                                          )}
                                        {resource.phone && (
                                          <span className="mt-0.5 flex items-center gap-1 text-blue-600">
                                            <Phone className="h-3 w-3" />
                                            {resource.phone}
                                          </span>
                                        )}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {requirements.length === 0 && (
                  <p className="text-center text-sm text-sage-500">
                    Complete more of the RECA form to see document requirements.
                  </p>
                )}

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  <p className="mb-1 font-semibold">
                    About Document Requirements:
                  </p>
                  <p className="text-[11px]">
                    Requirements update automatically as you fill out the RECA
                    application. Some documents (vital records, medical reports)
                    must be submitted as originals via mail.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="rounded-3xl border-2 border-terracotta-200 bg-terracotta-50">
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/reca/form/${sessionId}`)}
                  className="w-full justify-start gap-2 rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                >
                  <FileText className="h-4 w-4" />
                  Continue Application
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/reca/review/${sessionId}`)}
                  className="w-full justify-start gap-2 rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Review &amp; Submit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/resources")}
                  className="w-full justify-start gap-2 rounded-full border-terracotta-300 text-terracotta-700 hover:bg-terracotta-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Resource Finder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- shared nav ----------

function Nav({ name }: { name?: string | null }) {
  return (
    <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between p-6">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
            <Heart className="h-5 w-5 text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-sage-800">
            RadiantClaims
          </span>
        </Link>
        {name && <span className="text-sm text-sage-600">{name}</span>}
      </div>
    </nav>
  );
}
