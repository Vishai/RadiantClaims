"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Part9ProofOfPresence } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FieldLabel } from "@/components/reca/FieldLabel";
import {
  FileText,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Church,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload, UploadedDocument } from "../DocumentUpload";

// Validation schema
const part9Schema = z.object({
  ldsChurchAssistance: z.boolean().optional(),
  // Document uploads are tracked separately
});

type Part9FormData = z.infer<typeof part9Schema>;

interface Part9FormProps {
  initialData?: Partial<Part9ProofOfPresence>;
  onSubmit: (data: Part9ProofOfPresence) => void;
  sessionId: string;
}

export default function Part9Form({
  initialData,
  onSubmit,
  sessionId,
}: Part9FormProps) {
  const form = useForm<Part9FormData>({
    resolver: zodResolver(part9Schema),
    defaultValues: {
      ldsChurchAssistance: initialData?.ldsChurchAssistance || false,
    },
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >(
    initialData?.uploadedDocuments?.map((doc) => ({
      ...doc,
      uploadedAt: new Date(doc.uploadedAt),
      status: "success" as const,
    })) || []
  );

  const [isAcceptableDocsExpanded, setIsAcceptableDocsExpanded] =
    useState(true);

  // Helper function to get document type label
  const getDocumentTypeLabel = (docType: string): string => {
    const docTypeMap: Record<string, string> = {
      TAX_RECORDS: "Tax Records",
      PROPERTY_RECORDS: "Property Records",
      SCHOOL_ENROLLMENT: "School Enrollment Records",
      UTILITY_BILLS: "Utility Bills",
      MORTGAGE_STATEMENTS: "Mortgage Statements",
      RENTAL_AGREEMENTS: "Rental/Lease Agreements",
      EMPLOYMENT_RECORDS: "Employment Records",
      CENSUS_RECORDS: "Census Records",
      GOVERNMENT_CORRESPONDENCE: "Government Correspondence",
      GOVERNMENT_ID: "Government-Issued ID/Documents",
      VOTING_RECORDS: "Voting Records",
      MILITARY_RECORDS: "Military Records",
      CHURCH_RECORDS: "Church/Religious Records",
      BIRTH_MARRIAGE_RECORDS: "Birth/Marriage Records",
      OTHER: "Other Contemporary Documents",
    };
    return docTypeMap[docType] || docType;
  };

  const ldsChurchAssistance = form.watch("ldsChurchAssistance");

  // Auto-submit when data changes
  useEffect(() => {
    const handleSubmit = async (data: Part9FormData) => {
      const submissionData: Part9ProofOfPresence = {
        ldsChurchAssistance: data.ldsChurchAssistance,
        uploadedDocuments: uploadedDocuments
          .filter((doc) => doc.status === "success")
          .map((doc) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            documentType: doc.documentType,
            uploadedAt: doc.uploadedAt.toISOString(),
            fileSize: doc.fileSize,
          })),
      };
      await onSubmit(submissionData);
    };

    const subscription = form.watch(() => {
      const values = form.getValues();
      handleSubmit(values);
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit, uploadedDocuments]);

  // Also submit when documents change
  useEffect(() => {
    const values = form.getValues();
    const submissionData: Part9ProofOfPresence = {
      ldsChurchAssistance: values.ldsChurchAssistance,
      uploadedDocuments: uploadedDocuments
        .filter((doc) => doc.status === "success")
        .map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileKey: doc.fileKey,
          documentType: doc.documentType,
          uploadedAt: doc.uploadedAt.toISOString(),
          fileSize: doc.fileSize,
        })),
    };
    onSubmit(submissionData);
  }, [uploadedDocuments, form, onSubmit]);

  // Expose form submission to FormWizard
  React.useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      const values = form.getValues();
      const submissionData: Part9ProofOfPresence = {
        ldsChurchAssistance: values.ldsChurchAssistance,
        uploadedDocuments: uploadedDocuments
          .filter((doc) => doc.status === "success")
          .map((doc) => ({
            id: doc.id,
            fileName: doc.fileName,
            fileKey: doc.fileKey,
            documentType: doc.documentType,
            uploadedAt: doc.uploadedAt.toISOString(),
            fileSize: doc.fileSize,
          })),
      };
      await onSubmit(submissionData);
      return true; // Always valid
    };

    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [form, onSubmit, uploadedDocuments]);

  const successfulUploads = uploadedDocuments.filter(
    (doc) => doc.status === "success"
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Part 9: Proof of Presence in an Affected Area
          </CardTitle>
          <CardDescription>
            Upload documents that establish physical presence in affected areas
            during eligible time periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RECA Requirements */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-2 font-semibold text-blue-900">
                  RECA Requirements for Proof of Presence
                </p>
                <p className="mb-3 text-sm text-blue-800">
                  You must submit{" "}
                  <strong>at least TWO types of documents</strong> to prove
                  physical presence in an affected area for at least two years
                  after January 1, 1949:
                </p>
                <ol className="ml-2 list-inside list-decimal space-y-2 text-sm text-blue-800">
                  <li>
                    <strong>
                      One contemporaneous written residential document
                    </strong>{" "}
                    created during the time you were present (such as tax
                    records, school enrollment, or property documents)
                  </li>
                  <li>
                    <strong>
                      At least one additional employer-issued or
                      government-issued document
                    </strong>{" "}
                    that verifies physical presence in the affected area
                  </li>
                </ol>
                <p className="mt-3 text-sm text-blue-800">
                  <strong>Important:</strong> Each document must show the name
                  of the person who became ill (or an immediate family member in
                  the same household), the affected area location, and a
                  specific date during the eligible exposure period.
                </p>
                <p className="mt-2 text-sm font-medium text-blue-700">
                  Note: Affidavits or abstracts alone are not sufficient unless
                  attached to supporting records. Document certification is
                  recommended.
                </p>
              </div>
            </div>
          </div>

          {/* Acceptable Document Types Reference - Collapsible */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-sage-900">
                Acceptable Document Types
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setIsAcceptableDocsExpanded(!isAcceptableDocsExpanded)
                }
                className="gap-2"
              >
                {isAcceptableDocsExpanded ? (
                  <>
                    Hide <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {isAcceptableDocsExpanded && (
              <div className="space-y-4">
                {/* Residential Documents */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-blue-900">
                    Residential Documents (Need: 1)
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Tax Records (property tax rolls, returns)",
                      "Property Records (deed, mortgage, lease)",
                      "School Enrollment Records",
                      "Utility Bills (contemporaneous)",
                      "Mortgage/Rental Agreements",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        <span className="text-blue-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Official/Government Documents */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-terracotta-900">
                    Official/Government Documents (Need: 1+)
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Employment Records (employer-issued)",
                      "Census Records",
                      "Government Correspondence",
                      "Government-Issued ID/Documents",
                      "Voting Records",
                      "Military Records",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-terracotta-200 bg-terracotta-50 p-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-terracotta-600" />
                        <span className="text-terracotta-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Supporting */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-sage-700">
                    Additional Supporting Documents (Optional)
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Church/Religious Records",
                      "Birth/Marriage Records",
                      "Other Contemporary Documents",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-sage-200 bg-white p-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-sage-600" />
                        <span className="text-sage-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certification Requirements */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div>
                      <p className="mb-2 font-semibold text-amber-900">
                        Certification Requirements
                      </p>
                      <div className="space-y-2 text-sm text-amber-800">
                        <p>
                          <strong>Digital Upload (This Form):</strong>{" "}
                          Photocopies and scans are acceptable
                        </p>
                        <p>
                          <strong>Mail Filing:</strong> Documents must be
                          certified or original
                        </p>
                        <p className="mt-3 font-medium">
                          Certification Methods for Mail:
                        </p>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          <li>
                            Certified photocopies with institutional seal
                            (raised, colored, or signed)
                          </li>
                          <li>
                            Cover letter on letterhead stating documents are
                            "true and accurate copies"
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LDS Church Records Assistance */}
          <div className="space-y-4 border-t pt-4">
            <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Church className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-sage-900">
                      LDS Church Records Assistance
                    </h3>
                    <p className="mb-3 text-sm text-sage-700">
                      If you were a member of The Church of Jesus Christ of
                      Latter-day Saints, the Church's Member and Statistical
                      Records Division may have residence and vital records that
                      can help support your claim.
                    </p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                      ldsChurchAssistance
                        ? "border-blue-300 bg-blue-50"
                        : "border-sage-200 bg-white"
                    }`}
                  >
                    <Checkbox
                      id="ldsChurchAssistance"
                      checked={ldsChurchAssistance}
                      onCheckedChange={(checked) =>
                        form.setValue("ldsChurchAssistance", checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <FieldLabel
                        htmlFor="ldsChurchAssistance"
                        importance="optional"
                        className="cursor-pointer text-sm font-semibold uppercase leading-none text-sage-900"
                      >
                        I have contacted the Church of Jesus Christ of
                        Latter-day Saints and requested information regarding my
                        claim
                      </FieldLabel>
                    </div>
                  </div>

                  {/* Contact Information */}
                  {ldsChurchAssistance && (
                    <div className="rounded-lg border border-blue-200 bg-white p-4">
                      <div className="flex gap-3">
                        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                        <div>
                          <p className="mb-2 font-semibold text-blue-900">
                            LDS Church Contact Information
                          </p>
                          <div className="space-y-2 text-sm text-blue-800">
                            <p>
                              <strong>Phone:</strong> (801) 240-3500
                            </p>
                            <p>
                              <strong>Address:</strong>
                              <br />
                              Member and Statistical Records Division
                              <br />
                              17th Floor
                              <br />
                              50 East North Temple Street
                              <br />
                              Salt Lake City, UT 84150
                            </p>
                            <p className="mt-3 text-xs text-blue-700">
                              <strong>Note:</strong> The Church maintains
                              historical membership records that may include
                              residence information, baptism records, and other
                              documents that can help establish proof of
                              presence in affected areas. Contact them directly
                              to request records relevant to your RECA claim.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-sage-900">
                  Upload Proof of Presence Documents
                </Label>
                {successfulUploads > 0 && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {successfulUploads} document
                    {successfulUploads !== 1 ? "s" : ""} uploaded
                  </span>
                )}
              </div>

              {/* Info card about document upload timing */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">
                      <strong>Have documents ready now?</strong> Upload them
                      here to attach them to your claim.
                    </p>
                    <p>
                      <strong>Don't have them yet?</strong> That's okay! You can
                      continue with the form and upload documents later from
                      your dashboard's document section.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DocumentUpload
              sessionId={sessionId}
              onDocumentsChange={setUploadedDocuments}
              initialDocuments={uploadedDocuments}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card className="border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-cream-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-terracotta-200 pb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-terracotta-900">
                  Your Uploaded Documents
                </h3>
                <p className="text-sm font-medium text-green-700">
                  {successfulUploads} document
                  {successfulUploads !== 1 ? "s" : ""} saved to your claim
                </p>
              </div>
            </div>

            {/* Document List */}
            {successfulUploads > 0 ? (
              <div className="space-y-3">
                {uploadedDocuments
                  .filter((doc) => doc.status === "success")
                  .map((doc, idx) => {
                    const docTypeLabel = getDocumentTypeLabel(doc.documentType);

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-terracotta-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="truncate font-semibold text-sage-900">
                                  {doc.fileName}
                                </p>
                                <p className="mt-0.5 text-sm text-sage-600">
                                  Classified as:{" "}
                                  <span className="font-medium text-blue-700">
                                    {docTypeLabel}
                                  </span>
                                </p>
                                <p className="mt-1 text-xs text-sage-500">
                                  Uploaded:{" "}
                                  {new Date(doc.uploadedAt).toLocaleString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Saved Status Badge */}
                            <div className="mt-2 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2">
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                              <p className="text-xs text-green-800">
                                <span className="font-semibold">
                                  ✓ Saved to your claim
                                </span>
                                <span className="mt-0.5 block text-green-700">
                                  This document has been securely uploaded and
                                  linked to your claim. Our team will review it
                                  to verify it meets RECA requirements.
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <p className="mb-1 font-medium text-sage-800">
                  No documents uploaded yet
                </p>
                <p className="text-sm text-sage-600">
                  If you have proof of presence documents ready, use the upload
                  section above to add them now. Otherwise, you can upload
                  documents anytime from your dashboard.
                </p>
              </div>
            )}

            {/* Summary Message */}
            {successfulUploads >= 2 && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="mb-1 font-semibold text-green-900">
                      ✓ Documents Saved Successfully!
                    </p>
                    <p className="text-sm text-green-800">
                      You've uploaded and saved {successfulUploads} documents to
                      your claim. These are securely stored and linked to your
                      RECA application. Our team will review them to verify they
                      meet requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {successfulUploads === 1 && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="mb-1 font-semibold text-blue-900">
                      ✓ First Document Saved!
                    </p>
                    <p className="text-sm text-blue-800">
                      Your document has been securely saved to your claim.
                      Consider uploading at least one more document from a
                      different category to meet RECA's minimum requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div>
              <p className="text-sm text-sage-700">
                <strong>Next Section:</strong> After completing this section,
                you will move on to Part 10 where you will select the
                compensable disease(s) that developed. This form automatically
                saves your progress, so you can safely navigate away and return
                later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
