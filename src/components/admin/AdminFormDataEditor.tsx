"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  User,
  Users,
  Heart,
  MapPin,
  FileText,
  Activity,
  Stethoscope,
  DollarSign,
  Scale,
  PenTool,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import AdminEditReasonDialog from "./AdminEditReasonDialog";
import { getSectionDisplayName } from "@/lib/reca/workflow";
import type { RECAWorkflowSection } from "@/lib/reca/types";

interface AdminFormDataEditorProps {
  sessionId: string;
  formData: any;
  supportingForms: any;
  onDataUpdated: () => void;
}

// Field labels for human-readable display
const FIELD_LABELS: Record<string, Record<string, string>> = {
  part_1: {
    firstName: "First Name",
    middleName: "Middle Name",
    lastName: "Last Name",
    filingForSelf: "Filing For Self",
    ssn: "Social Security Number",
    dob: "Date of Birth",
    mailingAddress: "Mailing Address",
    city: "City",
    state: "State",
    zipCode: "ZIP Code",
    phoneDay: "Daytime Phone",
    phoneEvening: "Evening Phone",
    email: "Email Address",
    residenceAddress: "Residence Address",
    tribalAffiliation: "Tribal Affiliation",
    tribalCensusNumber: "Tribal Census Number",
    formerNames: "Former Names",
    tribalAssistance: "Tribal Assistance",
  },
  part_2: {
    firstName: "First Name",
    middleName: "Middle Name",
    lastName: "Last Name",
    ssn: "Social Security Number",
    dob: "Date of Birth",
    dod: "Date of Death",
    formerNames: "Former Names",
  },
  part_3: {
    relationship: "Relationship to Claimant",
  },
  part_5: {
    claimantDeceased: "Claimant Deceased",
    marriedOneYear: "Married at Least One Year",
    claimantPreviousMarriages: "Claimant Previous Marriages",
    filerOtherMarriages: "Filer Other Marriages",
  },
  part_6: {
    claimantDeceased: "Claimant Deceased",
    claimantEverMarried: "Claimant Ever Married",
    survivingSpouseExists: "Surviving Spouse Exists",
    childType: "Child Type",
    otherChildrenExist: "Other Children Exist",
  },
  part_7: {
    relationshipType: "Relationship Type",
  },
  part_8: {
    exposureOptions: "Exposure Options",
    affectedAreas: "Affected Areas",
    arizonaCounties: "Arizona Counties",
    nevadaCounties: "Nevada Counties",
  },
  part_9: {
    ldsChurchAssistance: "LDS Church Assistance",
    uploadedDocuments: "Uploaded Documents",
  },
  part_10: {
    diseases: "Compensable Diseases",
  },
  part_11: {
    medicalRecordsSubmitted: "Medical Records Submitted",
    cancerRegistryAuthorization: "Cancer Registry Authorization",
    resepAssistance: "RESEP Assistance",
    resepClinicName: "RESEP Clinic Name",
    uploadedDocuments: "Uploaded Documents",
  },
  part_12: {
    receivedPayment: "Received Previous Payment",
    paymentDetails: "Payment Details",
    eeoicpaClaim: "EEOICPA Claim Filed",
  },
  part_13: {
    hasAttorney: "Has Attorney",
    attorneyFirstName: "Attorney First Name",
    attorneyLastName: "Attorney Last Name",
    attorneyFirm: "Attorney Firm",
    attorneyAddress: "Attorney Address",
    attorneyCity: "Attorney City",
    attorneyState: "Attorney State",
    attorneyZip: "Attorney ZIP",
    attorneyPhone: "Attorney Phone",
    attorneyFax: "Attorney Fax",
    attorneyEmail: "Attorney Email",
  },
  part_14: {
    feeType: "Fee Type",
    attorneySignature: "Attorney Signature",
    attorneySignatureDate: "Signature Date",
  },
  part_15: {
    guardianFirstName: "Guardian First Name",
    guardianMiddleName: "Guardian Middle Name",
    guardianLastName: "Guardian Last Name",
    guardianAddress: "Guardian Address",
    guardianCity: "Guardian City",
    guardianState: "Guardian State",
    guardianZip: "Guardian ZIP",
    guardianPhoneDay: "Guardian Daytime Phone",
    guardianPhoneEvening: "Guardian Evening Phone",
    guardianEmail: "Guardian Email",
  },
  part_16: {
    signature: "Signature",
    signatureDate: "Signature Date",
    authorizationAcknowledgment: "Authorization Acknowledged",
  },
};

const DISEASE_LABELS: Record<string, string> = {
  leukemia: "Leukemia",
  multiple_myeloma: "Multiple Myeloma",
  lymphomas: "Lymphomas",
  thyroid: "Thyroid cancer",
  breast: "Breast cancer",
  esophagus: "Esophageal cancer",
  stomach: "Stomach cancer",
  pharynx: "Pharyngeal cancer",
  small_intestine: "Small intestine cancer",
  pancreas: "Pancreatic cancer",
  bile_ducts: "Bile duct cancer",
  gall_bladder: "Gall bladder cancer",
  salivary_gland: "Salivary gland cancer",
  urinary_bladder: "Urinary bladder cancer",
  brain: "Brain cancer",
  colon: "Colon cancer",
  ovary: "Ovarian cancer",
  liver: "Liver cancer",
  lung: "Lung cancer",
};

const SECTION_ICONS: Record<string, typeof User> = {
  part_1: User,
  part_2: Users,
  part_3: Heart,
  part_4: User,
  part_5: Users,
  part_6: Users,
  part_7: Users,
  part_8: MapPin,
  part_9: FileText,
  part_10: Activity,
  part_11: Stethoscope,
  part_12: DollarSign,
  part_13: Scale,
  part_14: Scale,
  part_15: ShieldCheck,
  part_16: PenTool,
};

// Fields that should not be editable inline (complex arrays, file uploads, signatures)
const READ_ONLY_FIELDS = new Set([
  "formerNames",
  "uploadedDocuments",
  "siblings",
  "claimantSpouses",
  "claimantPreviousSpouses",
  "filerOtherSpouses",
  "signature",
  "attorneySignature",
  "tribalAssistance",
]);

// Fields that are arrays and should be displayed as comma-joined or special
const ARRAY_FIELDS = new Set([
  "diseases",
  "exposureOptions",
  "affectedAreas",
  "arizonaCounties",
  "nevadaCounties",
]);

function maskSSN(ssn?: string): string {
  if (!ssn) return "Not provided";
  if (ssn.length >= 4) return `***-**-${ssn.slice(-4)}`;
  return "***-**-****";
}

function formatFieldValue(key: string, value: any, _partKey: string): string {
  if (value === undefined || value === null || value === "")
    return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "ssn") return maskSSN(value);
  if (
    key === "dob" ||
    key === "dod" ||
    key === "signatureDate" ||
    key === "attorneySignatureDate"
  ) {
    try {
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return value;
    }
  }
  if (key === "diseases" && Array.isArray(value)) {
    return value.map((d: string) => DISEASE_LABELS[d] || d).join(", ");
  }
  if (key === "exposureOptions" && Array.isArray(value)) {
    return value.join(", ");
  }
  if (key === "filingForSelf") return value ? "Self" : "Someone else";
  if (key === "authorizationAcknowledgment")
    return value ? "Acknowledged" : "Not acknowledged";
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-0.5">
      <span className="min-w-[160px] text-sm font-medium text-sage-800">
        {label}:
      </span>
      <span className="text-sm text-sage-700">{value}</span>
    </div>
  );
}

interface EditableFieldProps {
  fieldKey: string;
  label: string;
  value: any;
  onChange: (key: string, value: any) => void;
}

function EditableField({
  fieldKey,
  label,
  value,
  onChange,
}: EditableFieldProps) {
  const isBoolean = typeof value === "boolean";
  const isYesNo = value === "YES" || value === "NO";

  if (isBoolean) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="min-w-[160px] text-sm font-medium text-sage-800">
          {label}:
        </span>
        <select
          value={value ? "true" : "false"}
          onChange={(e) => onChange(fieldKey, e.target.value === "true")}
          className="rounded-md border border-sage-300 px-2 py-1 text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
    );
  }

  if (isYesNo) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="min-w-[160px] text-sm font-medium text-sage-800">
          {label}:
        </span>
        <select
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="rounded-md border border-sage-300 px-2 py-1 text-sm"
        >
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="min-w-[160px] text-sm font-medium text-sage-800">
        {label}:
      </span>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="h-8 max-w-[300px] text-sm"
      />
    </div>
  );
}

export default function AdminFormDataEditor({
  sessionId,
  formData,
  supportingForms,
  onDataUpdated,
}: AdminFormDataEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // All possible form sections
  const allSections: RECAWorkflowSection[] = [
    "part_1",
    "part_2",
    "part_3",
    "part_4",
    "part_5",
    "part_6",
    "part_7",
    "part_8",
    "part_9",
    "part_10",
    "part_11",
    "part_12",
    "part_13",
    "part_14",
    "part_15",
    "part_16",
  ];

  const handleStartEdit = (partKey: string) => {
    const partData = formData?.[partKey] || {};
    setEditValues({ ...partData });
    setEditingSection(partKey);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const handleFieldChange = (key: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveClick = () => {
    setShowReasonDialog(true);
  };

  const computeChangedCount = (): number => {
    if (!editingSection) return 0;
    const original = formData?.[editingSection] || {};
    let count = 0;
    for (const [key, val] of Object.entries(editValues)) {
      if (JSON.stringify(original[key]) !== JSON.stringify(val)) {
        count++;
      }
    }
    return count;
  };

  const handleConfirmSave = useCallback(
    async (reason: string) => {
      if (!editingSection) return;

      setIsSaving(true);
      try {
        const res = await fetch(`/api/admin/sessions/${sessionId}/edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData: { [editingSection]: editValues },
            reason,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to save");
        }

        setToast({
          type: "success",
          message: `Updated ${data.changedFields?.length || 0} field(s) successfully.`,
        });
        setEditingSection(null);
        setEditValues({});
        setShowReasonDialog(false);
        onDataUpdated();
      } catch (err: any) {
        setToast({
          type: "error",
          message: err.message || "Failed to save changes",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [editingSection, editValues, sessionId, onDataUpdated]
  );

  const handleRegeneratePacket = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(
        `/api/admin/sessions/${sessionId}/regenerate-packet`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToast({ type: "success", message: "Packet regeneration started." });
      onDataUpdated();
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "Failed to regenerate packet",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Auto-dismiss toast
  if (toast) {
    setTimeout(() => setToast(null), 4000);
  }

  const renderSection = (partKey: string) => {
    const partData = formData?.[partKey];
    const hasData = partData && Object.keys(partData).length > 0;
    const Icon = SECTION_ICONS[partKey] || FileText;
    const labels = FIELD_LABELS[partKey] || {};
    const isEditing = editingSection === partKey;

    return (
      <Card
        key={partKey}
        className={`border ${hasData ? "border-sage-200" : "border-amber-200 bg-amber-50/30"} ${
          isEditing ? "ring-2 ring-terracotta-300" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-sage-900">
              <Icon className="h-5 w-5 text-terracotta-500" />
              {getSectionDisplayName(partKey as RECAWorkflowSection)}
              {hasData ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={computeChangedCount() === 0}
                    className="gap-1.5 bg-terracotta-600 text-white hover:bg-terracotta-700"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save ({computeChangedCount()})
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(partKey)}
                  disabled={
                    editingSection !== null && editingSection !== partKey
                  }
                  className="gap-1.5 border-terracotta-200 text-terracotta-600 hover:bg-terracotta-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasData && !isEditing ? (
            <p className="text-sm text-amber-700">
              This section has not been completed yet.
            </p>
          ) : isEditing ? (
            <div className="space-y-1">
              {Object.entries(editValues).map(([key, value]) => {
                const label = labels[key] || key;
                if (READ_ONLY_FIELDS.has(key) || ARRAY_FIELDS.has(key)) {
                  return (
                    <ReviewField
                      key={key}
                      label={`${label} (read-only)`}
                      value={formatFieldValue(key, value, partKey)}
                    />
                  );
                }
                return (
                  <EditableField
                    key={key}
                    fieldKey={key}
                    label={label}
                    value={value}
                    onChange={handleFieldChange}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-0.5">
              {partData &&
                Object.entries(partData).map(([key, value]) => {
                  const label = labels[key] || key;
                  return (
                    <ReviewField
                      key={key}
                      label={label}
                      value={formatFieldValue(key, value, partKey)}
                    />
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Regenerate Packet Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRegeneratePacket}
          disabled={isRegenerating}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
          />
          {isRegenerating ? "Regenerating..." : "Regenerate PDF Packet"}
        </Button>
      </div>

      {/* Render all sections that have data or are relevant */}
      {allSections.map((section) => {
        const partData = formData?.[section];
        // Show section if it has data, even if it might be skippable
        if (!partData && !FIELD_LABELS[section]) return null;
        // Only show if data exists or it's a core section
        const coreAlways = [
          "part_1",
          "part_3",
          "part_8",
          "part_10",
          "part_12",
          "part_13",
          "part_16",
        ];
        if (!partData && !coreAlways.includes(section)) return null;
        return renderSection(section);
      })}

      {/* Supporting Forms (read-only display) */}
      {supportingForms && Object.keys(supportingForms).length > 0 && (
        <Card className="border border-sage-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-sage-900">
              <ShieldCheck className="h-5 w-5 text-terracotta-500" />
              Supporting Forms
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-sm text-sage-700">
            <ReviewField
              label="Certification of Identity"
              value={
                supportingForms.certificationOfIdentity?.fullName
                  ? "Completed"
                  : "Incomplete"
              }
            />
            <ReviewField
              label="Medical Info Release"
              value={
                supportingForms.medicalInformationRelease?.patientName
                  ? "Completed"
                  : "Incomplete"
              }
            />
            {supportingForms.tribalRecordsRelease && (
              <ReviewField
                label="Tribal Records Release"
                value={
                  supportingForms.tribalRecordsRelease.claimantName
                    ? "Completed"
                    : "Incomplete"
                }
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Reason dialog */}
      <AdminEditReasonDialog
        open={showReasonDialog}
        onClose={() => setShowReasonDialog(false)}
        onConfirm={handleConfirmSave}
        changedFieldsCount={computeChangedCount()}
        isLoading={isSaving}
      />
    </div>
  );
}
