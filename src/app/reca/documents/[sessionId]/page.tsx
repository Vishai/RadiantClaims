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
import { InviteCollaboratorDialog } from "@/components/portal/InviteCollaboratorDialog";
import { ClaimJourney } from "@/components/reca/ClaimJourney";
import { ManageCollaboratorsDialog } from "@/components/portal/ManageCollaboratorsDialog";
import {
  generateDocumentRequirements,
  generatePortalRequirements,
  applyUploadsToRequirements,
  calculateSubmissionReadiness,
  type DocumentRequirement,
  type PortalRequiredDocument,
} from "@/lib/reca/document-tracking";
import type { RelationshipType } from "@/lib/reca/types";

// ---------- helpers ----------

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    // Abstract categories (from generateDocumentRequirements)
    identity: "Identity & Vital Records",
    relationship: "Relationship Proof",
    medical: "Medical Documentation",
    presence: "Proof of Presence",
    legal: "Legal & Name Changes",
    // File categories (from generatePortalRequirements)
    BIRTH_CERTIFICATE: "Identity & Vital Records",
    DEATH_CERTIFICATE: "Identity & Vital Records",
    MARRIAGE_CERTIFICATE: "Legal & Name Changes",
    MEDICAL_RECORDS: "Medical Documentation",
    PATHOLOGY_REPORT: "Medical Documentation",
    PROOF_OF_RESIDENCE: "Proof of Presence",
    OTHER: "Additional Documents",
  };
  return map[cat] || cat;
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
  // Detailed portal requirements (per-document, form-data-aware)
  const [portalRequirements, setPortalRequirements] = useState<
    PortalRequiredDocument[]
  >([]);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

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

      let reqs = generateDocumentRequirements(
        relationship,
        fd.part_1,
        fd.part_4
      );

      // Hydrate requirement statuses from actual uploaded files
      let uploadedFiles: any[] = [];
      try {
        const docsRes = await fetch(`/api/documents?sessionId=${sessionId}`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          uploadedFiles = docsData.files || [];
          reqs = applyUploadsToRequirements(
            reqs,
            uploadedFiles as Array<{
              category?: string | null;
              validation?: { status?: string | null } | null;
            }>
          );
        }
      } catch (e) {
        console.warn("Failed to hydrate document requirement statuses:", e);
      }

      setRequirements(reqs);

      // Generate detailed portal requirements (per-document, form-aware)
      const portalReqs = generatePortalRequirements(
        claim.claimType || "DOWNWINDER",
        fd,
        uploadedFiles
      );
      setPortalRequirements(portalReqs);
    } catch (err) {
      console.error("Failed to load session data:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, refreshKey]);

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

  // Group portal requirements by display category for sidebar
  const groupedPortalRequirements = useMemo(() => {
    const groups: Record<string, PortalRequiredDocument[]> = {};
    for (const req of portalRequirements.filter((r) => r.required)) {
      const displayCat = categoryLabel(req.category);
      if (!groups[displayCat]) groups[displayCat] = [];
      groups[displayCat].push(req);
    }
    return groups;
  }, [portalRequirements]);

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
                Go to Portal
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
        {/* Claim Journey Stepper */}
        <ClaimJourney currentStage="documents" />

        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => router.push("/portal")}
          className="mb-6 gap-2 text-sage-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portal
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
        <InviteCollaboratorDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          intakeSessionId={sessionId}
          siblingOptions={
            Array.isArray(formData?.part_6?.siblings)
              ? formData.part_6.siblings
                  .map((sibling: { name?: string }) => sibling?.name?.trim())
                  .filter((name: string | undefined): name is string => !!name)
              : []
          }
        />
        <ManageCollaboratorsDialog
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
          intakeSessionId={sessionId}
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ---- LEFT: upload + file list ---- */}
          <div className="space-y-8 lg:col-span-2">
            {/* Family / sibling help */}
            <Card className="rounded-3xl border-2 border-sage-200 bg-white">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-sage-900">
                    Need help gathering documents?
                  </p>
                  <p className="text-sm text-sage-600">
                    Invite a sibling/family member to upload documents and leave
                    notes. They can’t edit your answers.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
                    onClick={() => setShowManageDialog(true)}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                  Personalized based on your application details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(groupedPortalRequirements).map(
                  ([displayCategory, reqs]) => (
                    <div key={displayCategory}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage-500">
                        {displayCategory}
                      </h4>
                      <div className="space-y-2">
                        {reqs.map((req, idx) => (
                          <div
                            key={`${req.category}-${idx}`}
                            className={`rounded-lg border-2 p-3 transition-colors ${
                              req.uploaded
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-sage-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {req.uploaded ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                              ) : (
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-400" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-sage-900">
                                    {req.label}
                                  </p>
                                  {req.uploaded ? (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                      Uploaded
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                                      Needed
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-sage-600">
                                  {req.description}
                                </p>
                                {!req.uploaded && req.helpText && (
                                  <p className="mt-1.5 flex items-start gap-1 text-[11px] text-amber-700">
                                    <HelpCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                    {req.helpText}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {portalRequirements.length === 0 && (
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
                    may need to be submitted as originals — DOJ may request
                    these after electronic filing to verify authenticity.
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
