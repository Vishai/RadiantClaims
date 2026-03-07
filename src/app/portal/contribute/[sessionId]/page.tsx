"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { Route } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import {
  CheckCircle2,
  FileText,
  Heart,
  Info,
  Plus,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

type NameChangeRecord = {
  previousName: string;
  dateOfChange: string;
  reasonForChange: "MARRIAGE" | "DIVORCE" | "LEGAL_NAME_CHANGE" | "OTHER";
  otherReason?: string;
};

type SiblingContributor = {
  index: number;
  name: string;
  dateOfBirth: string;
  cityOfBirth: string;
  stateOfBirth: string;
  isDeceased: "YES" | "NO";
  currentAddress: string;
  phoneNumber: string;
  hadNameChange: "YES" | "NO";
  originalLastName: string;
  nameChangeHistory: NameChangeRecord[];
};

type ContributorContext = {
  id: string;
  claimantName: string;
  relationship: string | null;
  siblings: SiblingContributor[];
  beneficiaries: Array<{
    beneficiaryName: string;
    beneficiarySsn: string;
    signatureDate: string;
    signature: string;
    attorneyName?: string;
    attorneyPhone?: string;
  }>;
  uploadedFiles: Array<{
    id: string;
    category: string | null;
    originalFilename: string;
    uploadedAt: string;
  }>;
};

const NAME_CHANGE_OPTIONS: Array<NameChangeRecord["reasonForChange"]> = [
  "MARRIAGE",
  "DIVORCE",
  "LEGAL_NAME_CHANGE",
  "OTHER",
];

function normalizeName(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function buildChecklist(sibling: SiblingContributor | null) {
  if (!sibling) return [];

  const items = [
    "Confirm your current mailing address and phone number.",
    "Confirm your birth details so the claim can establish the sibling relationship.",
    "Upload your birth certificate showing the same parent(s).",
  ];

  if (sibling.hadNameChange === "YES" || sibling.nameChangeHistory.length > 0) {
    items.push(
      "Upload each marriage certificate, divorce decree, or legal name change document that links your current name back to your birth certificate."
    );
  }

  items.push(
    "If you are willing, complete the Surviving Beneficiaries signature information so DOJ does not have to chase each sibling separately."
  );

  return items;
}

export default function CollaboratorContributionPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId;
  const requestedSibling = searchParams.get("sibling");
  const inviteToken = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState<ContributorContext | null>(null);
  const [selectedSiblingIndex, setSelectedSiblingIndex] = useState<number>(0);
  const [formData, setFormData] = useState<SiblingContributor | null>(null);
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    beneficiarySsn: "",
    signatureDate: "",
    signature: "",
    attorneyName: "",
    attorneyPhone: "",
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadContext = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/portal/collaborators/session?intakeSessionId=${sessionId}&inviteToken=${encodeURIComponent(inviteToken || "")}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load contributor workspace");
      }

      const sessionData = data.session as ContributorContext;
      setContext(sessionData);

      const matchedIndex = sessionData.siblings.findIndex((sibling) => {
        const siblingName = normalizeName(sibling.name);
        const requestedName = normalizeName(requestedSibling);
        return !!requestedName && siblingName === requestedName;
      });

      const nextIndex =
        matchedIndex >= 0
          ? matchedIndex
          : (sessionData.siblings[0]?.index ?? 0);
      setSelectedSiblingIndex(nextIndex);
      const selectedSibling = sessionData.siblings.find(
        (sibling) => sibling.index === nextIndex
      );
      setFormData(selectedSibling ?? null);
    } catch (error) {
      console.error(error);
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!inviteToken) {
      router.push("/" as Route);
      return;
    }

    void loadContext();
  }, [router, sessionId, requestedSibling, inviteToken]);

  useEffect(() => {
    if (!context) return;
    const sibling = context.siblings.find(
      (entry) => entry.index === selectedSiblingIndex
    );
    setFormData(sibling ?? null);

    const beneficiary = context.beneficiaries.find(
      (entry) =>
        normalizeName(entry.beneficiaryName) === normalizeName(sibling?.name)
    );
    setBeneficiaryForm({
      beneficiarySsn: beneficiary?.beneficiarySsn || "",
      signatureDate: beneficiary?.signatureDate || "",
      signature: beneficiary?.signature || "",
      attorneyName: beneficiary?.attorneyName || "",
      attorneyPhone: beneficiary?.attorneyPhone || "",
    });
  }, [context, selectedSiblingIndex]);

  const checklist = useMemo(() => buildChecklist(formData), [formData]);

  const handleChange = (
    field: keyof SiblingContributor,
    value: string | NameChangeRecord[]
  ) => {
    setFormData((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const updateNameChange = (
    index: number,
    field: keyof NameChangeRecord,
    value: string
  ) => {
    if (!formData) return;

    const next = [...formData.nameChangeHistory];
    next[index] = {
      ...next[index],
      [field]: value,
    } as NameChangeRecord;

    handleChange("nameChangeHistory", next);
  };

  const addNameChange = () => {
    if (!formData) return;
    handleChange("nameChangeHistory", [
      ...formData.nameChangeHistory,
      {
        previousName: "",
        dateOfChange: "",
        reasonForChange: "MARRIAGE",
        otherReason: "",
      },
    ]);
  };

  const removeNameChange = (index: number) => {
    if (!formData) return;
    handleChange(
      "nameChangeHistory",
      formData.nameChangeHistory.filter(
        (_, changeIndex) => changeIndex !== index
      )
    );
  };

  const saveContribution = async () => {
    if (!formData) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/portal/collaborators/contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeSessionId: sessionId,
          inviteToken,
          siblingIndex: formData.index,
          sibling: {
            dateOfBirth: formData.dateOfBirth,
            cityOfBirth: formData.cityOfBirth,
            stateOfBirth: formData.stateOfBirth,
            currentAddress: formData.currentAddress,
            phoneNumber: formData.phoneNumber,
            hadNameChange: formData.hadNameChange,
            originalLastName: formData.originalLastName,
            nameChangeHistory: formData.nameChangeHistory,
          },
          beneficiary: beneficiaryForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save your information");
      }

      setSaveMessage("Your contribution was saved.");
      await loadContext();
    } catch (error) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Failed to save your information"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-terracotta-500 border-t-transparent" />
          <p className="text-sage-700">Loading contributor workspace...</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="min-h-screen bg-cream-50 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl border-2 border-cream-200">
            <CardContent className="py-16 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-sage-300" />
              <h1 className="mb-2 text-2xl font-semibold text-sage-900">
                Contributor workspace unavailable
              </h1>
              <p className="mb-6 text-sage-600">
                We could not load your family contribution page. Please reopen
                the invite link or ask the claim owner to send a new invite.
              </p>
              <Button
                onClick={() =>
                  router.push(
                    inviteToken
                      ? (`/portal/invites/accept?token=${encodeURIComponent(inviteToken)}` as Route)
                      : ("/" as Route)
                  )
                }
              >
                Reopen invite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-500">
              <Heart className="h-5 w-5 text-white" fill="white" />
            </div>
            <div>
              <div className="text-xl font-bold text-sage-900">
                RadiantClaims
              </div>
              <div className="text-xs text-sage-500">
                Family contributor workspace
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-sage-600">
            {requestedSibling || "Family contributor"}
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <Card className="rounded-3xl border-2 border-cream-200">
            <CardHeader>
              <CardTitle className="text-sage-900">
                Help with {context.claimantName}
              </CardTitle>
              <CardDescription>
                This workspace is only for the information and documents your
                family member asked you to contribute. It does not create a new
                claim and does not require payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-sage-700">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      What to do here
                    </p>
                    <p className="mt-1">
                      Fill in your sibling details, then upload the birth
                      certificate and any name-change documents that apply to
                      you. The claim owner will keep the main application; you
                      are only supplying your piece of the record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">
                      No separate claim, no subscription
                    </p>
                    <p className="mt-1">
                      Your contribution is attached directly to the existing
                      claim. You are not being asked to start a new application
                      or buy a service plan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-2 border-cream-200">
            <CardHeader>
              <CardTitle className="text-sage-900">
                Requested from you
              </CardTitle>
              <CardDescription>
                Based on the current sibling section in the claim.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checklist.length === 0 ? (
                <p className="text-sm text-sage-600">
                  The claim owner has not listed sibling-specific details yet.
                  You can still upload documents below.
                </p>
              ) : (
                <ul className="space-y-3 text-sm text-sage-700">
                  {checklist.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <Card className="rounded-3xl border-2 border-cream-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <UserRound className="h-5 w-5 text-terracotta-500" />
                Your sibling information
              </CardTitle>
              <CardDescription>
                Update only the sibling entry that belongs to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {context.siblings.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="siblingSelect">Which sibling are you?</Label>
                  <select
                    id="siblingSelect"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedSiblingIndex}
                    onChange={(event) =>
                      setSelectedSiblingIndex(Number(event.target.value))
                    }
                  >
                    {context.siblings.map((sibling) => (
                      <option key={sibling.index} value={sibling.index}>
                        {sibling.name || `Sibling ${sibling.index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!formData ? (
                <p className="text-sm text-sage-600">
                  No sibling-specific entry is available yet. You can still
                  upload documents below and ask the claim owner to finish Part
                  6.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="dateOfBirth">Date of birth</Label>
                      <Input
                        id="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={(event) =>
                          handleChange("dateOfBirth", event.target.value)
                        }
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cityOfBirth">City of birth</Label>
                      <Input
                        id="cityOfBirth"
                        value={formData.cityOfBirth}
                        onChange={(event) =>
                          handleChange("cityOfBirth", event.target.value)
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stateOfBirth">State of birth</Label>
                      <Input
                        id="stateOfBirth"
                        value={formData.stateOfBirth}
                        onChange={(event) =>
                          handleChange("stateOfBirth", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phoneNumber">Phone number</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(event) =>
                          handleChange("phoneNumber", event.target.value)
                        }
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-1">
                      <Label htmlFor="currentAddress">
                        Current mailing address
                      </Label>
                      <Textarea
                        id="currentAddress"
                        value={formData.currentAddress}
                        onChange={(event) =>
                          handleChange("currentAddress", event.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-sage-900">
                      Have you ever changed your name?
                    </p>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={
                          formData.hadNameChange === "YES"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleChange("hadNameChange", "YES")}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={
                          formData.hadNameChange === "NO"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleChange("hadNameChange", "NO")}
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {formData.hadNameChange === "YES" && (
                    <div className="space-y-4 rounded-2xl border border-cream-200 bg-white p-4">
                      <div className="grid gap-2">
                        <Label htmlFor="originalLastName">
                          Last name at birth
                        </Label>
                        <Input
                          id="originalLastName"
                          value={formData.originalLastName}
                          onChange={(event) =>
                            handleChange("originalLastName", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-4">
                        {formData.nameChangeHistory.map((change, index) => (
                          <div
                            key={`${index}-${change.previousName}`}
                            className="rounded-2xl border border-cream-200 bg-cream-50 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-sm font-semibold text-sage-900">
                                Name change {index + 1}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeNameChange(index)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="grid gap-2">
                                <Label>Previous name</Label>
                                <Input
                                  value={change.previousName}
                                  onChange={(event) =>
                                    updateNameChange(
                                      index,
                                      "previousName",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Date of change</Label>
                                <Input
                                  value={change.dateOfChange}
                                  onChange={(event) =>
                                    updateNameChange(
                                      index,
                                      "dateOfChange",
                                      event.target.value
                                    )
                                  }
                                  placeholder="MM/DD/YYYY"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Reason</Label>
                                <select
                                  className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                                  value={change.reasonForChange}
                                  onChange={(event) =>
                                    updateNameChange(
                                      index,
                                      "reasonForChange",
                                      event.target.value
                                    )
                                  }
                                >
                                  {NAME_CHANGE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option.replaceAll("_", " ")}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {change.reasonForChange === "OTHER" && (
                                <div className="grid gap-2">
                                  <Label>Other reason</Label>
                                  <Input
                                    value={change.otherReason || ""}
                                    onChange={(event) =>
                                      updateNameChange(
                                        index,
                                        "otherReason",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addNameChange}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add name change
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-sage-600">
                      Save your details before uploading documents so the claim
                      owner sees the latest information.
                    </div>
                    <Button onClick={saveContribution} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save my information"}
                    </Button>
                  </div>
                  {saveMessage && (
                    <p className="text-sm text-sage-700">{saveMessage}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {context.relationship === "Child" && formData && (
              <Card className="rounded-3xl border-2 border-cream-200">
                <CardHeader>
                  <CardTitle className="text-sage-900">
                    Beneficiary signature
                  </CardTitle>
                  <CardDescription>
                    This is the sibling signature step that can help the claim
                    move faster by reducing DOJ follow-up.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Only one claim is filed for all surviving children. If you
                    sign here, your information is added to the existing
                    surviving beneficiaries form for {context.claimantName}.
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="beneficiarySsn">
                        Social Security number
                      </Label>
                      <Input
                        id="beneficiarySsn"
                        value={beneficiaryForm.beneficiarySsn}
                        onChange={(event) =>
                          setBeneficiaryForm((current) => ({
                            ...current,
                            beneficiarySsn: event.target.value,
                          }))
                        }
                        placeholder="123-45-6789"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="signatureDate">Signature date</Label>
                      <Input
                        id="signatureDate"
                        value={beneficiaryForm.signatureDate}
                        onChange={(event) =>
                          setBeneficiaryForm((current) => ({
                            ...current,
                            signatureDate: event.target.value,
                          }))
                        }
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="signature">Your signature</Label>
                      <Input
                        id="signature"
                        value={beneficiaryForm.signature}
                        onChange={(event) =>
                          setBeneficiaryForm((current) => ({
                            ...current,
                            signature: event.target.value,
                          }))
                        }
                        placeholder={
                          formData.name || "Type your full legal name"
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attorneyName">
                        Attorney name (optional)
                      </Label>
                      <Input
                        id="attorneyName"
                        value={beneficiaryForm.attorneyName}
                        onChange={(event) =>
                          setBeneficiaryForm((current) => ({
                            ...current,
                            attorneyName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attorneyPhone">
                        Attorney phone (optional)
                      </Label>
                      <Input
                        id="attorneyPhone"
                        value={beneficiaryForm.attorneyPhone}
                        onChange={(event) =>
                          setBeneficiaryForm((current) => ({
                            ...current,
                            attorneyPhone: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sage-900">
                  <Upload className="h-5 w-5 text-terracotta-500" />
                  Upload your documents
                </CardTitle>
                <CardDescription>
                  Upload only the records that apply to you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentUploadZone
                  sessionId={sessionId}
                  onUploadComplete={() => {
                    void loadContext();
                  }}
                />

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  Birth certificates usually belong under{" "}
                  <strong>Birth Certificate</strong>. Marriage certificates and
                  court orders should go under the applicable name-change
                  document type.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-cream-200">
              <CardHeader>
                <CardTitle className="text-sage-900">Recent uploads</CardTitle>
              </CardHeader>
              <CardContent>
                {context.uploadedFiles.length === 0 ? (
                  <p className="text-sm text-sage-600">
                    No documents have been uploaded yet for this claim.
                  </p>
                ) : (
                  <ul className="space-y-3 text-sm text-sage-700">
                    {context.uploadedFiles.map((file) => (
                      <li
                        key={file.id}
                        className="rounded-xl border border-cream-200 p-3"
                      >
                        <div className="font-medium text-sage-900">
                          {file.originalFilename}
                        </div>
                        <div className="text-xs text-sage-500">
                          {file.category || "UNCATEGORIZED"} •{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
