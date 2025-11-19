"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface GuestUploadWizardProps {
  uploadToken: any; // Typed as any to avoid complex Prisma type imports in client component for now
  claimantName: string;
  recipientName: string;
}

type Step = "info" | "upload" | "success";

export function GuestUploadWizard({
  uploadToken,
  claimantName,
  recipientName,
}: GuestUploadWizardProps) {
  const [step, setStep] = useState<Step>(
    uploadToken.guestData ? "upload" : "info"
  );
  const [formData, setFormData] = useState({
    fullName: recipientName || "",
    phone: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/documents/upload/guest-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: uploadToken.token,
          guestData: formData,
        }),
      });

      if (!res.ok) throw new Error("Failed to save info");

      setStep("upload");
    } catch (error) {
      console.error("Error saving guest info:", error);
      alert("Failed to save information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (step === "success") {
    return (
      <Card className="mx-auto max-w-xl border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-emerald-900">
            Documents Uploaded!
          </h2>
          <p className="text-emerald-700">
            Thank you for helping {claimantName} with their claim. The documents
            have been securely received.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Steps Indicator */}
      <div className="mb-8 flex items-center justify-center gap-4">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            step === "info"
              ? "bg-terracotta-600 text-white"
              : "bg-terracotta-100 text-terracotta-600"
          }`}
        >
          1
        </div>
        <div className="h-0.5 w-12 bg-gray-200" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
            step === "upload"
              ? "bg-terracotta-600 text-white"
              : "bg-terracotta-100 text-terracotta-600"
          }`}
        >
          2
        </div>
      </div>

      {step === "info" && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Your Information</CardTitle>
            <CardDescription>
              Please provide your current contact information to help us process
              these documents correctly for {claimantName}.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleInfoSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Legal Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(555) 555-5555"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Current Mailing Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State, ZIP"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">
                  Notes for {claimantName} (Optional)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any extra details about these documents..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full gap-2 bg-terracotta-600 hover:bg-terracotta-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Continue to Upload"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Please upload the requested documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadToken.targetCategory && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">
                  Requested Document
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  Please upload:{" "}
                  <strong>
                    {uploadToken.targetCategory.replace(/_/g, " ")}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            <DocumentUploadZone
              sessionId={uploadToken.intakeSessionId}
              className="w-full"
              onUploadComplete={(fileId) => {
                console.log("Guest upload complete:", fileId);
                // Optionally auto-advance or just show success message
                // For now, we let them upload multiple if needed, but provide a "Finish" button
              }}
            />

            <div className="rounded-lg bg-sage-50 p-4 text-sm text-sage-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>
                  Your uploads are encrypted and securely stored. Only the
                  claimant and their legal team can access them.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => setStep("success")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              I'm Finished Uploading
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
