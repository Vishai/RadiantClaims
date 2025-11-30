import { useState, useEffect } from "react";
import {
  prioritizeTasks,
  DocumentTask,
  PriorityTask,
  mapCategoryToDocType,
} from "@/lib/prirority-engine";
import { ChecklistSection } from "@/lib/document-checklist";
import { FileCategory } from "@/lib/intake-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  Mail,
  AlertTriangle,
  FileSignature,
  Lock,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadedFile {
  id: string;
  category: FileCategory | null;
  originalFilename: string;
  sizeBytes: number;
  uploadedAt: Date;
  status: string;
}

interface PriorityTaskListProps {
  checklist: ChecklistSection[];
  uploadedFiles: UploadedFile[];
  intakeSessionId: string;
  onCategorySelect: (category: FileCategory) => void;
}

export function PriorityTaskList({
  checklist,
  uploadedFiles = [],
  intakeSessionId,
  onCategorySelect,
}: PriorityTaskListProps) {
  const [tasks, setTasks] = useState<PriorityTask[]>([]);
  const [isDeceased, setIsDeceased] = useState(false);

  // Medical Request State
  const [hospitalName, setHospitalName] = useState("");
  const [treatmentYear, setTreatmentYear] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [requestGenerated, setRequestGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    // Convert checklist to tasks
    const rawTasks: DocumentTask[] = [];

    checklist.forEach((section) => {
      section.requirements.forEach((req) => {
        // Check if we have files for this category
        const fileCount = uploadedFiles.filter(
          (f) => f.category === req.category
        ).length;
        const isComplete = fileCount >= req.minRequired;

        // Only add if required or if we have files (even if optional)
        if (req.isRequired || fileCount > 0) {
          rawTasks.push({
            id: req.category,
            type: mapCategoryToDocType(req.category),
            category: req.category,
            status: isComplete ? "RECEIVED" : "MISSING",
            label: req.title,
            description: req.description,
          });
        }
      });
    });

    // Pass isDeceased to priority engine
    const prioritized = prioritizeTasks(rawTasks, isDeceased);
    setTasks(prioritized);
  }, [checklist, uploadedFiles, isDeceased]);

  const handleGenerateRequest = async () => {
    if (!hospitalName || !treatmentYear || !cancerType) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/intake/generate-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeSessionId,
          hospitalName,
          treatmentYear,
          cancerType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate request");
      }

      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Medical_Request_${hospitalName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setRequestGenerated(true);
    } catch (error) {
      console.error("Generation failed", error);
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate packet"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Separate tasks by status
  const activeTasks = tasks.filter((t) => t.status !== "RECEIVED");
  const completedTasks = tasks.filter((t) => t.status === "RECEIVED");

  // Check if ID is uploaded (Golden Triad Requirement)
  const isIdUploaded = uploadedFiles.some((f) => f.category === "IDENTITY");

  // Check if Death Cert is uploaded (if deceased)
  const isDeathCertUploaded = uploadedFiles.some(
    (f) =>
      f.category === "OTHER" &&
      f.originalFilename.toLowerCase().includes("death")
  ); // Simplified check for now

  // Critical Intervention Logic
  const topTask = activeTasks[0];
  const showMedicalIntervention =
    topTask?.type === "MEDICAL_PATHOLOGY" && !requestGenerated;

  return (
    <div className="space-y-8">
      {/* Deceased Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-cream-200 bg-cream-100 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-2">
            <FileSignature className="h-5 w-5 text-sage-600" />
          </div>
          <div>
            <p className="font-medium text-sage-900">Filing for a loved one?</p>
            <p className="text-xs text-sage-600">
              We'll adjust the document requirements.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="deceased-mode" className="text-sm text-sage-700">
            No
          </Label>
          <Switch
            id="deceased-mode"
            checked={isDeceased}
            onCheckedChange={setIsDeceased}
          />
          <Label htmlFor="deceased-mode" className="text-sm text-sage-700">
            Yes
          </Label>
        </div>
      </div>

      {/* Critical Intervention Card: The Golden Triad */}
      {showMedicalIntervention && (
        <Card className="overflow-hidden border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-white shadow-md">
          <div className="flex items-center gap-2 bg-terracotta-500 px-6 py-2 text-white">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wider">
              Critical Action Required
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl text-terracotta-900">
              Start Your Medical Record Request
            </CardTitle>
            <CardDescription className="text-base text-terracotta-700">
              This is the longest step (6-12 months). We need to generate a{" "}
              <strong>HIPAA-Compliant Request Packet</strong> today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Death Certificate (If Deceased) */}
            {isDeceased && !isDeathCertUploaded && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h4 className="font-bold text-amber-900">
                    Step 0: Upload Death Certificate
                  </h4>
                  <p className="mb-3 text-sm text-amber-800">
                    Hospitals will NOT release records without proof of
                    executorship or death certificate.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => onCategorySelect("OTHER")} // Mapping to OTHER for now as VITAL_DEATH isn't in FileCategory yet
                  >
                    Upload Certificate
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1: ID Check (The Gatekeeper) */}
            {!isIdUploaded ? (
              <div className="rounded-xl border-2 border-dashed border-terracotta-300 bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-full bg-terracotta-100 p-2">
                    <Lock className="h-5 w-5 text-terracotta-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sage-900">
                      Step 1: Upload Photo ID
                    </h4>
                    <p className="text-sm text-sage-600">
                      Hospitals require a copy of your ID to verify your
                      signature. We cannot generate the request without it.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full bg-terracotta-500 text-white hover:bg-terracotta-600"
                  onClick={() => onCategorySelect("IDENTITY")}
                >
                  Upload Driver's License / ID
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  ID Uploaded - Ready for Request Generation
                </span>
              </div>
            )}

            {/* Step 2: Request Details */}
            <div
              className={`space-y-4 ${!isIdUploaded ? "pointer-events-none opacity-50 grayscale" : ""}`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  Step 2
                </Badge>
                <h4 className="font-semibold text-sage-900">Request Details</h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital">Hospital Name</Label>
                  <Input
                    id="hospital"
                    placeholder="e.g. St. George Regional"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Treatment Year</Label>
                  <Input
                    id="year"
                    placeholder="e.g. 1982"
                    value={treatmentYear}
                    onChange={(e) => setTreatmentYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cancer">Cancer Type</Label>
                  <Input
                    id="cancer"
                    placeholder="e.g. Lung Cancer"
                    value={cancerType}
                    onChange={(e) => setCancerType(e.target.value)}
                  />
                </div>
              </div>

              <hr className="border-terracotta-100" />

              <div className="flex flex-col items-center justify-between gap-3 rounded-xl bg-terracotta-50 p-4 sm:flex-row">
                <div className="text-sm text-terracotta-800">
                  <p className="font-bold">Ready to Generate?</p>
                  <p>
                    We will create a PDF with your ID, Cover Letter, and HIPAA
                    Form.
                  </p>
                  {generationError && (
                    <p className="mt-1 font-bold text-red-600">
                      Error: {generationError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleGenerateRequest}
                  disabled={
                    !hospitalName ||
                    !treatmentYear ||
                    !cancerType ||
                    !isIdUploaded ||
                    isGenerating
                  }
                  className="w-full bg-terracotta-600 text-white shadow-sm hover:bg-terracotta-700 sm:w-auto"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileSignature className="mr-2 h-4 w-4" />
                      Sign & Generate Packet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Generated Success State */}
      {requestGenerated &&
        activeTasks.some((t) => t.type === "MEDICAL_PATHOLOGY") && (
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-emerald-100 p-2">
                  <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    Packet Generated Successfully!
                  </h3>
                  <p className="mb-4 text-emerald-800">
                    We have compiled your <strong>Golden Triad Packet</strong>{" "}
                    (Letter + HIPAA + ID).
                    <br />
                    Please sign the HIPAA form (Page 2) and mail/fax this entire
                    packet to <strong>{hospitalName}</strong>.
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                      Download PDF Packet
                    </Button>
                    <Button
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => setRequestGenerated(false)}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Priority Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-sage-900">Your Action Plan</h2>
          <span className="text-sm text-sage-600">Sorted by Urgency</span>
        </div>

        {activeTasks.map((task, index) => (
          <Card
            key={task.id}
            className={`cursor-pointer border-2 transition-all hover:shadow-md ${index === 0 ? "border-terracotta-200 shadow-sm" : "border-cream-200 opacity-90 hover:opacity-100"} `}
            onClick={() => onCategorySelect(task.category)}
          >
            <CardContent className="p-0">
              <div className="flex items-stretch">
                {/* Priority Indicator Strip */}
                <div
                  className={`w-2 flex-shrink-0 ${task.urgencyLabel === "CRITICAL" ? "bg-terracotta-500" : ""} ${task.urgencyLabel === "HIGH" ? "bg-orange-400" : ""} ${task.urgencyLabel === "NORMAL" ? "bg-sage-400" : ""} ${task.urgencyLabel === "LOW" ? "bg-sage-200" : ""} `}
                />

                <div className="flex flex-1 items-center gap-4 p-5">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {task.urgencyLabel === "CRITICAL" && (
                        <Badge
                          variant="destructive"
                          className="border-terracotta-200 bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200"
                        >
                          High Priority
                        </Badge>
                      )}
                      <h3 className="font-semibold text-sage-900">
                        {task.label}
                      </h3>
                    </div>
                    <p className="line-clamp-1 text-sm text-sage-600">
                      {task.description}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-sage-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Est. Time: {task.estimatedLeadTimeDays} days
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={index === 0 ? "default" : "outline"}
                    className={`rounded-full px-4 ${index === 0 ? "bg-terracotta-500 hover:bg-terracotta-600" : "border-sage-200 text-sage-600"} `}
                  >
                    {index === 0 ? "Start Now" : "Upload"}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {activeTasks.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-cream-200 bg-cream-50 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-semibold text-sage-900">
              All Caught Up!
            </h3>
            <p className="text-sage-600">
              You've uploaded all required documents.
            </p>
          </div>
        )}
      </div>

      {/* Completed Items Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 border-t border-cream-200 pt-8">
          <h3 className="text-lg font-semibold text-sage-700">
            Completed Items
          </h3>
          <div className="grid gap-3 opacity-75">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-sage-800 line-through decoration-emerald-500/30">
                    {task.label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sage-500 hover:text-sage-700"
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
