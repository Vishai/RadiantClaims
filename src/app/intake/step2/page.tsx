"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Upload,
  X,
  Save,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { PriorityTaskList } from "@/components/intake/priority-task-list";
import { MailInProcessBanner } from "@/components/mail-in-process-banner";
import { DOCUMENT_CHECKLIST } from "@/lib/document-checklist";
import {
  uploadFile,
  // deleteFile, // Currently unused but kept for future use
  getIntakeSession,
  createIntakeSession,
  FileCategory,
  validateFile,
} from "@/lib/intake-upload";

interface UploadedFile {
  id: string;
  category: FileCategory | null;
  originalFilename: string;
  sizeBytes: number;
  uploadedAt: Date;
  status: string;
}

interface IntakeSession {
  id: string;
  resumeToken: string;
  currentStep: string;
  status: string;
  uploadedFiles: UploadedFile[];
  claimant?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

function Step2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const claimantId = searchParams.get("claimantId");
  const { data: authSession, status: authStatus } = useSession();

  const [session, setSession] = useState<IntakeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Load or create session with authorization check
  useEffect(() => {
    const initSession = async () => {
      // Wait for auth to load
      if (authStatus === "loading") {
        return;
      }

      // User must be authenticated
      if (authStatus === "unauthenticated") {
        router.push(
          `/login?callbackUrl=/intake/step2${token ? `?token=${token}` : claimantId ? `?claimantId=${claimantId}` : ""}`
        );
        return;
      }

      try {
        if (token) {
          // Resume existing session
          const { session: existingSession } = await getIntakeSession(token);

          // AUTHORIZATION CHECK: Verify logged-in user owns this session
          if (existingSession.claimant?.email !== authSession?.user?.email) {
            setError(
              "Unauthorized: You don't have permission to access this session"
            );
            setLoading(false);
            return;
          }

          setSession(existingSession);
        } else if (claimantId) {
          // Create new session for claimant
          const { session: newSession } = await createIntakeSession({
            claimantId,
          });

          // AUTHORIZATION CHECK: Verify logged-in user owns this claimant
          if (newSession.claimant?.email !== authSession?.user?.email) {
            setError(
              "Unauthorized: You don't have permission to access this claimant"
            );
            setLoading(false);
            return;
          }

          setSession(newSession);
          // Update URL with token
          router.replace(`/intake/step2?token=${newSession.resumeToken}`);
        } else {
          // No token or claimantId - redirect to portal to see their claims
          router.push("/portal");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [token, claimantId, router, authStatus, authSession]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session || !selectedCategory) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadFile({
        file,
        intakeSessionId: session.id,
        category: selectedCategory,
        onProgress: setUploadProgress,
      });

      if (result.success) {
        // Reload session to get updated files
        const { session: updatedSession } = await getIntakeSession(
          session.resumeToken
        );
        setSession(updatedSession);
        setSelectedCategory(null);
        // Reset file input
        e.target.value = "";
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Function to delete a file (currently unused but kept for future use)
  // const handleDeleteFile = async (fileId: string) => {
  //   if (!session) return;

  //   const success = await deleteFile(fileId);
  //   if (success) {
  //     // Reload session
  //     const { session: updatedSession } = await getIntakeSession(
  //       session.resumeToken
  //     );
  //     setSession(updatedSession);
  //   }
  // };

  const handleSaveForLater = async () => {
    if (!session || !session.claimant?.email) {
      setEmailError("Unable to send email - claimant information not found");
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSent(false);

    try {
      const response = await fetch("/api/email/send-resume-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.claimant.email,
          resumeToken: session.resumeToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSent(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to send email"
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleContinue = () => {
    // TODO: Navigate to next step - consent page not yet created
    const resumeToken = session?.resumeToken || "";
    router.push(`/intake/consent?token=${resumeToken}` as any);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
          <p className="text-sage-700">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
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
          <Button
            variant="outline"
            onClick={handleSaveForLater}
            disabled={isSendingEmail}
            className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
          >
            <Save className="h-4 w-4" />
            {isSendingEmail ? "Sending..." : "Save for Later"}
          </Button>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            Step 2: Upload Your Documents
          </h1>
          <p className="text-lg text-sage-700">
            Upload digital copies of your documents now. We'll validate them and
            guide you on mailing originals later.
            <br />
            Don't worry if you don't have everything today — you can save and
            come back anytime.
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Mail-In Process Banner */}
        <MailInProcessBanner />

        {/* Success Message */}
        {emailSent && (
          <div className="mb-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 p-6">
            <div className="flex gap-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-700" />
              <div>
                <h3 className="mb-1 font-semibold text-green-900">
                  Email sent successfully!
                </h3>
                <p className="text-sm text-green-800">
                  We've sent a resume link to{" "}
                  <strong>{session?.claimant?.email}</strong>. Check your inbox
                  to continue your application later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {emailError && (
          <div className="mb-6 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-100 p-6">
            <div className="flex gap-4">
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-700" />
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-red-900">
                  Failed to send email
                </h3>
                <p className="text-sm text-red-800">{emailError}</p>
              </div>
              <button
                onClick={() => setEmailError(null)}
                className="rounded-full p-1 transition-colors hover:bg-red-200"
              >
                <X className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        <Card className="mb-8 rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sage-900">Your Progress</CardTitle>
            <CardDescription className="text-sage-600">
              {(session.uploadedFiles || []).length} total document
              {(session.uploadedFiles || []).length !== 1 ? "s" : ""} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Identity Document */}
              {(() => {
                const identityCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "IDENTITY"
                ).length;
                return (
                  <div className="flex items-center justify-between rounded-xl bg-cream-50 p-4">
                    <div className="flex items-center gap-3">
                      {identityCount >= 1 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-sage-300" />
                      )}
                      <span className="text-sm font-medium text-sage-900">
                        Government-Issued Photo ID
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${identityCount >= 1 ? "text-emerald-700" : "text-terracotta-600"}`}
                    >
                      {identityCount} of 1
                    </span>
                  </div>
                );
              })()}

              {/* Proof of Residence */}
              {(() => {
                const residenceCategories = [
                  "PROOF_OF_RESIDENCE",
                  "UTILITY_BILL",
                  "SCHOOL_RECORDS",
                  "MORTGAGE_STATEMENT",
                  "LDS_CHURCH_RECORDS",
                ];
                const residenceCount = (session.uploadedFiles || []).filter(
                  (f) => f.category && residenceCategories.includes(f.category)
                ).length;
                return (
                  <div className="flex items-center justify-between rounded-xl bg-cream-50 p-4">
                    <div className="flex items-center gap-3">
                      {residenceCount >= 2 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-sage-300" />
                      )}
                      <span className="text-sm font-medium text-sage-900">
                        Proofs of Residence (1951-1962)
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${residenceCount >= 2 ? "text-emerald-700" : "text-terracotta-600"}`}
                    >
                      {residenceCount} of 2
                    </span>
                  </div>
                );
              })()}

              {/* Medical Documentation */}
              {(() => {
                const pathologyCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "PATHOLOGY_REPORT"
                ).length;
                return (
                  <div className="flex items-center justify-between rounded-xl bg-cream-50 p-4">
                    <div className="flex items-center gap-3">
                      {pathologyCount >= 1 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-sage-300" />
                      )}
                      <span className="text-sm font-medium text-sage-900">
                        Medical Document (proving illness)
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${pathologyCount >= 1 ? "text-emerald-700" : "text-terracotta-600"}`}
                    >
                      {pathologyCount} of 1
                    </span>
                  </div>
                );
              })()}

              {/* Overall Progress Bar */}
              {(() => {
                const identityCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "IDENTITY"
                ).length;
                const residenceCategories = [
                  "PROOF_OF_RESIDENCE",
                  "UTILITY_BILL",
                  "SCHOOL_RECORDS",
                  "MORTGAGE_STATEMENT",
                  "LDS_CHURCH_RECORDS",
                ];
                const residenceCount = (session.uploadedFiles || []).filter(
                  (f) => f.category && residenceCategories.includes(f.category)
                ).length;
                const pathologyCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "PATHOLOGY_REPORT"
                ).length;

                const totalCompleted =
                  (identityCount >= 1 ? 1 : 0) +
                  (residenceCount >= 2 ? 1 : 0) +
                  (pathologyCount >= 1 ? 1 : 0);
                const totalRequired = 3;
                const percentComplete = Math.round(
                  (totalCompleted / totalRequired) * 100
                );

                return (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-sage-700">
                        Overall Progress
                      </span>
                      <span className="text-2xl font-bold text-terracotta-600">
                        {percentComplete}%
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className="h-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 transition-all duration-500"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Important Note */}
        <div className="mb-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-cream-100 p-6">
          <div className="flex gap-4">
            <Info className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
            <div>
              <h3 className="mb-2 font-semibold text-amber-900">
                Your documents are safely saved
              </h3>
              <p className="text-sm text-amber-800">
                We automatically save your progress as you upload. You can leave
                at any time and return using the "Save for Later" link.
                Documents are securely stored and attached to your profile.{" "}
                <strong>
                  You don't need to complete everything in one sitting.
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Priority Task List */}
        <PriorityTaskList
          checklist={DOCUMENT_CHECKLIST}
          uploadedFiles={session.uploadedFiles}
          intakeSessionId={session.id}
          onCategorySelect={setSelectedCategory}
        />

        {/* Upload Modal/Dialog */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sage-900">Upload File</CardTitle>
                    <CardDescription className="text-sage-600">
                      Category: {selectedCategory.replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full p-1 transition-colors hover:bg-cream-100"
                  >
                    <X className="h-5 w-5 text-sage-500" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-terracotta-200 bg-terracotta-50 p-4 text-sm text-terracotta-800">
                    {error}
                  </div>
                )}

                <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-8 text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-sage-400" />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm text-sage-700"
                  >
                    <span className="font-semibold text-terracotta-600 hover:text-terracotta-700">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                    <br />
                    <span className="text-xs text-sage-500">
                      PDF, JPG, PNG or HEIC (max 50MB)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.heic"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-700">Uploading...</span>
                      <span className="font-medium text-terracotta-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className="h-full bg-terracotta-500 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/intake")}
            className="rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
          >
            ← Back to Information
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleSaveForLater}
              disabled={isSendingEmail}
              className="flex-1 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50 sm:flex-none"
            >
              {isSendingEmail ? "Sending..." : "Save & Resume Later"}
            </Button>
            <Button
              onClick={handleContinue}
              disabled={(() => {
                const identityCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "IDENTITY"
                ).length;
                const residenceCategories = [
                  "PROOF_OF_RESIDENCE",
                  "UTILITY_BILL",
                  "SCHOOL_RECORDS",
                  "MORTGAGE_STATEMENT",
                  "LDS_CHURCH_RECORDS",
                ];
                const residenceCount = (session.uploadedFiles || []).filter(
                  (f) => f.category && residenceCategories.includes(f.category)
                ).length;
                const pathologyCount = (session.uploadedFiles || []).filter(
                  (f) => f.category === "PATHOLOGY_REPORT"
                ).length;

                return (
                  identityCount < 1 || residenceCount < 2 || pathologyCount < 1
                );
              })()}
              className="flex-1 rounded-full bg-terracotta-500 px-8 hover:bg-terracotta-600 sm:flex-none"
            >
              Continue to Consent →
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-sage-50 to-cream-100 p-6 text-center">
          <p className="text-sm text-sage-700">
            <strong>Need help finding documents?</strong> We can assist you in
            obtaining medical records, utility bills, and other required
            documents. Just save your progress and contact our support team.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function Step2Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent"></div>
            <p className="text-sage-700">Loading...</p>
          </div>
        </div>
      }
    >
      <Step2Content />
    </Suspense>
  );
}
