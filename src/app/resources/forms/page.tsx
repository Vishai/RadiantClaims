"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Info,
  Heart,
  HelpCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { RECAFormType } from "@prisma/client";

interface RECAForm {
  id: string;
  formType: RECAFormType;
  fileName: string;
  fileKey: string;
  version: string;
  pageCount: number;
  description: string;
  instructions: string;
  oMBApprovalNo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FormMetadata {
  title: string;
  shortDescription: string;
  icon: string;
  whoShouldUse: string[];
}

const FORM_METADATA: Record<RECAFormType, FormMetadata> = {
  DOWNWINDER: {
    title: "Downwinder Claim Form",
    shortDescription:
      "For individuals who lived in affected areas during nuclear testing (1951-1962)",
    icon: "🏠",
    whoShouldUse: [
      "Lived in covered counties in AZ, NV, or UT during 1951-1962",
      "Diagnosed with a covered cancer",
      "Met latency requirements (2-5 years after exposure)",
    ],
  },
  URANIUM_WORKER: {
    title: "Uranium Worker Claim Form",
    shortDescription: "For uranium miners, millers, and ore transporters",
    icon: "⛏️",
    whoShouldUse: [
      "Worked in uranium mines or mills",
      "Transported uranium ore",
      "Diagnosed with a covered illness",
    ],
  },
  MANHATTAN_PROJECT_WASTE: {
    title: "Manhattan Project Waste Site Worker Form",
    shortDescription: "For workers at nuclear waste cleanup sites",
    icon: "🏭",
    whoShouldUse: [
      "Worked at designated Manhattan Project waste sites",
      "Exposed to radiation during cleanup operations",
      "Diagnosed with a covered illness",
    ],
  },
  GENERAL_RECA: {
    title: "General RECA Information Form",
    shortDescription: "Overview and general information about RECA claims",
    icon: "📋",
    whoShouldUse: [
      "Want to understand RECA eligibility requirements",
      "Need general program information",
      "Determining which specific form to use",
    ],
  },
};

export default function FormsLibraryPage() {
  const [forms, setForms] = useState<RECAForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingForm, setDownloadingForm] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch forms");
      }

      setForms(data.forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formType: RECAFormType, fileName: string) => {
    setDownloadingForm(formType);
    try {
      const formTypeParam = formType.toLowerCase().replace(/_/g, "-");
      const response = await fetch(`/api/forms/download/${formTypeParam}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Download failed");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingForm(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <FormsNav />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <FormsNav />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchForms} className="mt-4">
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <FormsNav />

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-sage-900">
              RECA Forms Library
            </h1>
            <p className="text-xl text-sage-700">
              Download the forms you need to file your RECA claim
            </p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
          </div>

          {/* Which Form Helper */}
          <Card className="mb-8 border-2 border-terracotta-200 bg-gradient-to-br from-terracotta-50 to-peach-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-terracotta-600" />
                <div>
                  <CardTitle className="text-sage-900">
                    Not sure which form you need?
                  </CardTitle>
                  <CardDescription>
                    Use our quick decision helper to find the right form
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Dialog open={showWizard} onOpenChange={setShowWizard}>
                <DialogTrigger asChild>
                  <Button className="bg-terracotta-600 hover:bg-terracotta-700">
                    Start Form Wizard
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <FormWizard onComplete={() => setShowWizard(false)} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Forms Grid */}
          <div className="space-y-6">
            {forms.map((form) => {
              const metadata = FORM_METADATA[form.formType];
              return (
                <FormCard
                  key={form.id}
                  form={form}
                  metadata={metadata}
                  isDownloading={downloadingForm === form.formType}
                  onDownload={handleDownload}
                />
              );
            })}
          </div>

          {/* Additional Resources */}
          <Card className="mt-12 border-2 border-sage-200">
            <CardHeader>
              <CardTitle className="text-sage-900">
                Need Help with Your Documents?
              </CardTitle>
              <CardDescription>
                We provide additional resources to help you complete your claim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-sage-200 p-4 opacity-60">
                  <FileText className="mt-1 h-5 w-5 text-sage-600" />
                  <div>
                    <h3 className="font-semibold text-sage-900">
                      Document Resource Directory (Coming Soon)
                    </h3>
                    <p className="text-sm text-sage-600">
                      Find where to get birth certificates, medical records, and
                      more
                    </p>
                  </div>
                </div>

                <Link
                  href="/intake"
                  className="flex items-start gap-3 rounded-lg border border-sage-200 p-4 transition-colors hover:bg-sage-50"
                >
                  <CheckCircle className="mt-1 h-5 w-5 text-sage-600" />
                  <div>
                    <h3 className="font-semibold text-sage-900">
                      Start Your Claim Packet
                    </h3>
                    <p className="text-sm text-sage-600">
                      Let us guide you through the entire process
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-20 border-t border-cream-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-500">
                <Heart className="h-4 w-4 text-white" fill="white" />
              </div>
              <span className="font-semibold text-sage-800">RadiantClaims</span>
            </div>
            <p className="text-sm text-sage-600">
              &copy; 2024 RadiantClaims. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FormsNav() {
  return (
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
        <Link href="/intake">
          <Button className="rounded-full bg-terracotta-500 px-8 py-6 hover:bg-terracotta-600">
            Start Claim Packet
          </Button>
        </Link>
      </div>
    </nav>
  );
}

interface FormCardProps {
  form: RECAForm;
  metadata: FormMetadata;
  isDownloading: boolean;
  onDownload: (formType: RECAFormType, fileName: string) => void;
}

function FormCard({
  form,
  metadata,
  isDownloading,
  onDownload,
}: FormCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden rounded-3xl border-2 border-sage-200 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        {/* Left: Icon and Title */}
        <div className="flex items-start gap-4 p-6 md:w-2/3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-3xl">
            {metadata.icon}
          </div>
          <div className="flex-1">
            <h2 className="mb-2 text-2xl font-bold text-sage-900">
              {metadata.title}
            </h2>
            <p className="mb-3 text-sage-700">{metadata.shortDescription}</p>
            <div className="flex flex-wrap gap-2 text-sm text-sage-600">
              <span className="rounded-full bg-sage-100 px-3 py-1">
                {form.pageCount} pages
              </span>
              <span className="rounded-full bg-sage-100 px-3 py-1">
                {form.version}
              </span>
              {form.oMBApprovalNo && (
                <span className="rounded-full bg-sage-100 px-3 py-1">
                  OMB: {form.oMBApprovalNo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col justify-center gap-3 border-t border-sage-200 bg-sage-50 p-6 md:w-1/3 md:border-l md:border-t-0">
          <Button
            onClick={() => onDownload(form.formType, form.fileName)}
            disabled={isDownloading}
            className="w-full bg-terracotta-600 hover:bg-terracotta-700"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Info className="h-4 w-4" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <span className="text-3xl">{metadata.icon}</span>
                  {metadata.title}
                </DialogTitle>
                <DialogDescription>{form.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-sage-900">
                    Who should use this form:
                  </h3>
                  <ul className="space-y-2">
                    {metadata.whoShouldUse.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
                        <span className="text-sm text-sage-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-sage-900">
                    Instructions:
                  </h3>
                  <p className="text-sm text-sage-700">{form.instructions}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-sage-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-sage-900">
                      {form.fileName}
                    </p>
                    <p className="text-xs text-sage-600">
                      {form.pageCount} pages • {form.version}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      onDownload(form.formType, form.fileName);
                      setShowDetails(false);
                    }}
                    disabled={isDownloading}
                    className="bg-terracotta-600 hover:bg-terracotta-700"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}

function FormWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    claimType: "",
    location: "",
    workType: "",
  });

  const getRecommendation = () => {
    if (answers.claimType === "resident") {
      return {
        formType: "DOWNWINDER" as RECAFormType,
        ...FORM_METADATA.DOWNWINDER,
      };
    }
    if (answers.workType === "uranium") {
      return {
        formType: "URANIUM_WORKER" as RECAFormType,
        ...FORM_METADATA.URANIUM_WORKER,
      };
    }
    if (answers.workType === "waste") {
      return {
        formType: "MANHATTAN_PROJECT_WASTE" as RECAFormType,
        ...FORM_METADATA.MANHATTAN_PROJECT_WASTE,
      };
    }
    return {
      formType: "GENERAL_RECA" as RECAFormType,
      ...FORM_METADATA.GENERAL_RECA,
    };
  };

  const recommendation = step === 4 ? getRecommendation() : null;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Find Your Form</DialogTitle>
        <DialogDescription>
          Answer a few questions to determine which form you need
        </DialogDescription>
      </DialogHeader>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sage-900">
            What best describes your situation?
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setAnswers({ ...answers, claimType: "resident" });
                setStep(4);
              }}
              className="w-full rounded-lg border-2 border-sage-200 p-4 text-left transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
            >
              <div className="font-semibold text-sage-900">
                I (or my family member) lived in a covered area during nuclear
                testing
              </div>
              <p className="text-sm text-sage-600">
                Arizona, Nevada, or Utah during 1951-1962
              </p>
            </button>

            <button
              onClick={() => {
                setAnswers({ ...answers, claimType: "worker" });
                setStep(2);
              }}
              className="w-full rounded-lg border-2 border-sage-200 p-4 text-left transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
            >
              <div className="font-semibold text-sage-900">
                I (or my family member) worked in a radiation-exposed job
              </div>
              <p className="text-sm text-sage-600">
                Uranium mining, milling, or waste cleanup
              </p>
            </button>

            <button
              onClick={() => {
                setAnswers({ ...answers, claimType: "unsure" });
                setStep(3);
              }}
              className="w-full rounded-lg border-2 border-sage-200 p-4 text-left transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
            >
              <div className="font-semibold text-sage-900">
                I'm not sure / I need general information
              </div>
              <p className="text-sm text-sage-600">
                Learn about RECA eligibility
              </p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sage-900">
            What type of work was performed?
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setAnswers({ ...answers, workType: "uranium" });
                setStep(4);
              }}
              className="w-full rounded-lg border-2 border-sage-200 p-4 text-left transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
            >
              <div className="font-semibold text-sage-900">
                Uranium mining, milling, or ore transport
              </div>
            </button>

            <button
              onClick={() => {
                setAnswers({ ...answers, workType: "waste" });
                setStep(4);
              }}
              className="w-full rounded-lg border-2 border-sage-200 p-4 text-left transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
            >
              <div className="font-semibold text-sage-900">
                Manhattan Project waste site cleanup
              </div>
            </button>
          </div>
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sage-900">General Information</h3>
          <p className="text-sage-700">
            We recommend starting with the General RECA Information Form to
            understand the program requirements and determine your eligibility.
          </p>
          <Button
            onClick={() => {
              setAnswers({ ...answers, workType: "general" });
              setStep(4);
            }}
          >
            Continue
          </Button>
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
        </div>
      )}

      {step === 4 && recommendation && (
        <div className="space-y-4">
          <div className="rounded-lg bg-terracotta-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-4xl">{recommendation.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-sage-900">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-sage-700">
                  {recommendation.shortDescription}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sage-900">
                This form is right for you if:
              </p>
              <ul className="space-y-1">
                {recommendation.whoShouldUse.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
                    <span className="text-sm text-sage-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onComplete} className="flex-1">
              Close & Find Form Above
            </Button>
            <Button variant="outline" onClick={() => setStep(1)}>
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
