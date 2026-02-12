"use client";

import { useRouter } from "next/navigation";
import { RECAWorkflowState, RECAWorkflowSection } from "@/lib/reca/types";
import {
  getSectionSequence,
  shouldSkipSection,
  getSectionDisplayName,
  getSupportingFormsForClaim,
  isSupportingFormOptional,
  type SupportingFormType,
} from "@/lib/reca/workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CheckCircle2,
  AlertCircle,
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
  ClipboardList,
} from "lucide-react";

interface ReviewSectionProps {
  workflowState: RECAWorkflowState;
  sessionId: string;
}

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

const EXPOSURE_LABELS: Record<string, string> = {
  option_1a:
    "Physically present in affected area (Jan 21, 1951 - Oct 31, 1958)",
  option_1b:
    "Physically present in affected area (Jun 30, 1962 - Jul 31, 1962)",
  option_2: "Participated in atmospheric nuclear test",
};

function maskSSN(ssn?: string): string {
  if (!ssn) return "Not provided";
  if (ssn.length >= 4) return `***-**-${ssn.slice(-4)}`;
  return "***-**-****";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Not provided";
  try {
    const [datePartMaybe] = dateStr.split("T");
    const datePart = datePartMaybe ?? "";
    const parts = datePart.split("-");
    if (parts.length === 3 && (parts[0]?.length ?? 0) === 4) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (![year, month, day].some((value) => Number.isNaN(value))) {
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }

    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  } catch {
    return dateStr;
  }
  return dateStr;
}

function SectionCard({
  title,
  icon: Icon,
  section,
  sessionId,
  hasData,
  children,
  editPath,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: RECAWorkflowSection;
  sessionId: string;
  hasData: boolean;
  children: React.ReactNode;
  editPath?: string;
}) {
  const router = useRouter();

  const handleEdit = () => {
    if (editPath) {
      router.push(editPath as any);
    } else if (section) {
      router.push(`/reca/form/${sessionId}?section=${section}` as any);
    }
  };

  return (
    <Card
      className={`border ${hasData ? "border-sage-200" : "border-amber-200 bg-amber-50/30"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-sage-900">
            <Icon className="h-5 w-5 text-terracotta-500" />
            {title}
            {hasData ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="gap-1.5 border-terracotta-200 text-terracotta-600 hover:bg-terracotta-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <div className="space-y-1 text-sm text-sage-700">{children}</div>
        ) : (
          <p className="text-sm text-amber-700">
            This section has not been completed yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="min-w-[140px] font-medium text-sage-800">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function ReviewSection({
  workflowState,
  sessionId,
}: ReviewSectionProps) {
  const { formData, supportingForms } = workflowState;
  const relationship = formData.part_3?.relationship;
  const supportingFormsForClaim = getSupportingFormsForClaim(formData);

  const supportingFormCompletion: Record<SupportingFormType, boolean> = {
    certification_of_identity:
      !!supportingForms?.certificationOfIdentity?.fullName,
    medical_info_release:
      !!supportingForms?.medicalInformationRelease?.patientName,
    tribal_records_release:
      !!supportingForms?.tribalRecordsRelease?.claimantName,
    surviving_beneficiaries:
      (supportingForms?.survivingBeneficiariesSignatures?.beneficiaries
        ?.length || 0) > 0,
  };

  const supportingFormsComplete = supportingFormsForClaim.every((form) =>
    isSupportingFormOptional(form) ? true : supportingFormCompletion[form]
  );
  const supportingFormsStarted = supportingFormsForClaim.some(
    (form) => supportingFormCompletion[form]
  );

  const formatSupportingFormStatus = (form: SupportingFormType): string => {
    if (supportingFormCompletion[form]) return "Completed";
    if (isSupportingFormOptional(form)) return "Optional";
    return "Incomplete";
  };

  // Get the relevant section sequence for this user
  const sections = relationship
    ? getSectionSequence(relationship)
    : (["part_1", "part_3"] as RECAWorkflowSection[]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">
              Review Your Application
            </p>
            <p className="text-sm text-blue-800">
              Please review all sections below. Click "Edit" on any section to
              make changes. When everything looks correct, click "Continue" to
              complete your application.
            </p>
          </div>
        </div>
      </div>

      {/* Part 1: Your Information */}
      <SectionCard
        title={getSectionDisplayName("part_1")}
        icon={User}
        section="part_1"
        sessionId={sessionId}
        hasData={!!formData.part_1?.firstName}
      >
        <ReviewField
          label="Name"
          value={
            formData.part_1
              ? [
                  formData.part_1.firstName,
                  formData.part_1.middleName,
                  formData.part_1.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
              : undefined
          }
        />
        <ReviewField label="SSN" value={maskSSN(formData.part_1?.ssn)} />
        <ReviewField
          label="Date of Birth"
          value={formatDate(formData.part_1?.dob)}
        />
        <ReviewField
          label="Address"
          value={
            formData.part_1
              ? [
                  formData.part_1.mailingAddress,
                  formData.part_1.city,
                  formData.part_1.state,
                  formData.part_1.zipCode,
                ]
                  .filter(Boolean)
                  .join(", ")
              : undefined
          }
        />
        <ReviewField label="Email" value={formData.part_1?.email} />
        <ReviewField label="Phone" value={formData.part_1?.phoneDay} />
        {formData.part_1?.filingForSelf !== undefined && (
          <ReviewField
            label="Filing For"
            value={formData.part_1.filingForSelf ? "Myself" : "Someone else"}
          />
        )}
      </SectionCard>

      {/* Part 2: Claimant Information (conditional) */}
      {!shouldSkipSection("part_2", formData) &&
        sections.includes("part_2") && (
          <SectionCard
            title={getSectionDisplayName("part_2")}
            icon={Users}
            section="part_2"
            sessionId={sessionId}
            hasData={!!formData.part_2?.firstName}
          >
            <ReviewField
              label="Name"
              value={
                formData.part_2
                  ? [
                      formData.part_2.firstName,
                      formData.part_2.middleName,
                      formData.part_2.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : undefined
              }
            />
            <ReviewField label="SSN" value={maskSSN(formData.part_2?.ssn)} />
            <ReviewField
              label="Date of Birth"
              value={formatDate(formData.part_2?.dob)}
            />
            {formData.part_2?.dod && (
              <ReviewField
                label="Date of Death"
                value={formatDate(formData.part_2.dod)}
              />
            )}
          </SectionCard>
        )}

      {/* Part 3: Relationship */}
      <SectionCard
        title={getSectionDisplayName("part_3")}
        icon={Heart}
        section="part_3"
        sessionId={sessionId}
        hasData={!!formData.part_3?.relationship}
      >
        <ReviewField
          label="Relationship"
          value={formData.part_3?.relationship}
        />
      </SectionCard>

      {/* Parts 4-7: Relationship-specific (show the applicable one) */}
      {relationship === "Self" && sections.includes("part_4") && (
        <SectionCard
          title={getSectionDisplayName("part_4")}
          icon={User}
          section="part_4"
          sessionId={sessionId}
          hasData={true}
        >
          <p>Self-filer - no additional information required.</p>
        </SectionCard>
      )}

      {relationship === "Spouse" && sections.includes("part_5") && (
        <SectionCard
          title={getSectionDisplayName("part_5")}
          icon={Users}
          section="part_5"
          sessionId={sessionId}
          hasData={!!formData.part_5?.claimantDeceased}
        >
          <ReviewField
            label="Claimant Deceased"
            value={formData.part_5?.claimantDeceased}
          />
          <ReviewField
            label="Married One Year"
            value={formData.part_5?.marriedOneYear}
          />
          <ReviewField
            label="Previous Marriages"
            value={formData.part_5?.claimantPreviousMarriages}
          />
        </SectionCard>
      )}

      {relationship === "Child" && sections.includes("part_6") && (
        <SectionCard
          title={getSectionDisplayName("part_6")}
          icon={Users}
          section="part_6"
          sessionId={sessionId}
          hasData={!!formData.part_6?.claimantDeceased}
        >
          <ReviewField
            label="Claimant Deceased"
            value={formData.part_6?.claimantDeceased}
          />
          <ReviewField label="Child Type" value={formData.part_6?.childType} />
          <ReviewField
            label="Other Children Exist"
            value={formData.part_6?.otherChildrenExist}
          />
          {formData.part_6?.siblings && (
            <ReviewField
              label="Siblings Listed"
              value={`${formData.part_6.siblings.length}`}
            />
          )}
        </SectionCard>
      )}

      {relationship &&
        ["Parent", "Grandchild", "Grandparent"].includes(relationship) &&
        sections.includes("part_7") && (
          <SectionCard
            title={getSectionDisplayName("part_7")}
            icon={Users}
            section="part_7"
            sessionId={sessionId}
            hasData={!!formData.part_7?.relationshipType}
          >
            <ReviewField
              label="Relationship Type"
              value={formData.part_7?.relationshipType}
            />
          </SectionCard>
        )}

      {/* Part 8: Exposure Information */}
      <SectionCard
        title={getSectionDisplayName("part_8")}
        icon={MapPin}
        section="part_8"
        sessionId={sessionId}
        hasData={!!formData.part_8?.exposureOptions?.length}
      >
        {formData.part_8?.exposureOptions?.map((opt) => (
          <ReviewField
            key={opt}
            label="Exposure"
            value={EXPOSURE_LABELS[opt] || opt}
          />
        ))}
        {formData.part_8?.affectedAreas?.map((area, i) => (
          <ReviewField
            key={`area-${i}`}
            label="Location"
            value={`${area.townCity}, ${area.state} (${area.timePeriod})`}
          />
        ))}
        {formData.part_8?.arizonaCounties?.map((c, i) => (
          <ReviewField
            key={`az-${i}`}
            label="Arizona"
            value={`${c.townCity}, ${c.county} County (${c.timePeriod})`}
          />
        ))}
        {formData.part_8?.nevadaCounties?.map((c, i) => (
          <ReviewField
            key={`nv-${i}`}
            label="Nevada"
            value={`${c.townCity}, ${c.county} County (${c.timePeriod})`}
          />
        ))}
      </SectionCard>

      {/* Part 9: Proof of Presence */}
      <SectionCard
        title={getSectionDisplayName("part_9")}
        icon={FileText}
        section="part_9"
        sessionId={sessionId}
        hasData={
          !!formData.part_9?.uploadedDocuments?.length ||
          typeof formData.part_9?.ldsChurchAssistance === "boolean"
        }
      >
        {formData.part_9?.uploadedDocuments?.length ? (
          <ReviewField
            label="Documents Uploaded"
            value={`${formData.part_9.uploadedDocuments.length} document(s)`}
          />
        ) : (
          <p>No documents uploaded yet.</p>
        )}
        {formData.part_9?.ldsChurchAssistance && (
          <ReviewField label="LDS Church Assistance" value="Requested" />
        )}
      </SectionCard>

      {/* Part 10: Compensable Diseases */}
      <SectionCard
        title={getSectionDisplayName("part_10")}
        icon={Activity}
        section="part_10"
        sessionId={sessionId}
        hasData={!!formData.part_10?.diseases?.length}
      >
        {formData.part_10?.diseases?.map((disease) => (
          <ReviewField
            key={disease}
            label="Disease"
            value={DISEASE_LABELS[disease] || disease}
          />
        ))}
      </SectionCard>

      {/* Part 11: Proof of Disease */}
      <SectionCard
        title={getSectionDisplayName("part_11")}
        icon={Stethoscope}
        section="part_11"
        sessionId={sessionId}
        hasData={formData.part_11?.medicalRecordsSubmitted !== undefined}
      >
        <ReviewField
          label="Medical Records"
          value={
            formData.part_11?.medicalRecordsSubmitted
              ? "Submitted"
              : "Not submitted"
          }
        />
        {formData.part_11?.cancerRegistryAuthorization && (
          <ReviewField label="Cancer Registry" value="Authorized" />
        )}
        {formData.part_11?.resepAssistance && (
          <ReviewField
            label="RESEP Assistance"
            value={formData.part_11.resepAssistance}
          />
        )}
        {formData.part_11?.uploadedDocuments?.length ? (
          <ReviewField
            label="Documents Uploaded"
            value={`${formData.part_11.uploadedDocuments.length} document(s)`}
          />
        ) : null}
      </SectionCard>

      {/* Part 12: Previous Payments */}
      <SectionCard
        title={getSectionDisplayName("part_12")}
        icon={DollarSign}
        section="part_12"
        sessionId={sessionId}
        hasData={!!formData.part_12?.receivedPayment}
      >
        <ReviewField
          label="Previous Payment"
          value={formData.part_12?.receivedPayment}
        />
        <ReviewField
          label="EEOICPA Claim"
          value={formData.part_12?.eeoicpaClaim}
        />
      </SectionCard>

      {/* Part 13: Attorney Representation */}
      <SectionCard
        title={getSectionDisplayName("part_13")}
        icon={Scale}
        section="part_13"
        sessionId={sessionId}
        hasData={!!formData.part_13?.hasAttorney}
      >
        <ReviewField
          label="Has Attorney"
          value={formData.part_13?.hasAttorney}
        />
        {formData.part_13?.hasAttorney === "YES" && (
          <>
            <ReviewField
              label="Attorney Name"
              value={
                [
                  formData.part_13.attorneyFirstName,
                  formData.part_13.attorneyLastName,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            <ReviewField label="Firm" value={formData.part_13.attorneyFirm} />
            <ReviewField label="Phone" value={formData.part_13.attorneyPhone} />
          </>
        )}
      </SectionCard>

      {/* Part 14: Attorney Acknowledgment (conditional) */}
      {formData.part_13?.hasAttorney === "YES" && (
        <SectionCard
          title={getSectionDisplayName("part_14")}
          icon={Scale}
          section="part_14"
          sessionId={sessionId}
          hasData={!!formData.part_14?.feeType}
        >
          <ReviewField
            label="Fee Type"
            value={
              formData.part_14?.feeType === "initial_2_percent"
                ? "Initial filing (2%)"
                : formData.part_14?.feeType === "resubmission_10_percent"
                  ? "Resubmission (10%)"
                  : undefined
            }
          />
          <ReviewField
            label="Signed"
            value={formData.part_14?.attorneySignature ? "Yes" : "No"}
          />
        </SectionCard>
      )}

      {/* Part 16: Signature */}
      <SectionCard
        title={getSectionDisplayName("part_16")}
        icon={PenTool}
        section="part_16"
        sessionId={sessionId}
        hasData={!!formData.part_16?.signature}
      >
        <ReviewField
          label="Signed"
          value={formData.part_16?.signature ? "Yes" : "Not yet"}
        />
        <ReviewField
          label="Signature Date"
          value={formatDate(formData.part_16?.signatureDate)}
        />
        <ReviewField
          label="Authorization"
          value={
            formData.part_16?.authorizationAcknowledgment
              ? "Acknowledged"
              : "Not acknowledged"
          }
        />
      </SectionCard>

      {/* Supporting Forms */}
      <SectionCard
        title="Supporting Forms"
        icon={ShieldCheck}
        section="supporting_forms"
        sessionId={sessionId}
        editPath={`/reca/supporting/${sessionId}`}
        hasData={supportingFormsComplete || supportingFormsStarted}
      >
        {supportingFormsForClaim.includes("certification_of_identity") && (
          <ReviewField
            label="Certification of Identity"
            value={formatSupportingFormStatus("certification_of_identity")}
          />
        )}
        {supportingFormsForClaim.includes("medical_info_release") && (
          <ReviewField
            label="Medical Info Release"
            value={formatSupportingFormStatus("medical_info_release")}
          />
        )}
        {supportingFormsForClaim.includes("tribal_records_release") && (
          <ReviewField
            label="Tribal Records Release"
            value={formatSupportingFormStatus("tribal_records_release")}
          />
        )}
        {supportingFormsForClaim.includes("surviving_beneficiaries") && (
          <ReviewField
            label="Surviving Beneficiaries"
            value={
              supportingFormCompletion.surviving_beneficiaries
                ? `${supportingForms?.survivingBeneficiariesSignatures?.beneficiaries?.length || 0} beneficiary(ies)`
                : formatSupportingFormStatus("surviving_beneficiaries")
            }
          />
        )}
      </SectionCard>
    </div>
  );
}
