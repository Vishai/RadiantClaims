"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Download, ArrowLeft, Printer, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LDSRECAFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const allowedReturnUrls = [
    "/intake/step2",
    "/portal",
    "/service-tiers",
  ] as const satisfies readonly Route[];
  type AllowedReturnUrl = (typeof allowedReturnUrls)[number];

  const requestedReturnUrl = searchParams.get("returnUrl");
  const returnUrl: AllowedReturnUrl =
    requestedReturnUrl &&
    allowedReturnUrls.includes(requestedReturnUrl as AllowedReturnUrl)
      ? (requestedReturnUrl as AllowedReturnUrl)
      : "/intake/step2";
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownload = () => {
    // Trigger download of the PDF
    const link = document.createElement("a");
    link.href = "/forms/lds-reca-form-2025.pdf";
    link.download = "LDS-RECA-Form-2025.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // Open the PDF in a new window for printing
    window.open("/forms/lds-reca-form-2025.pdf", "_blank");
  };

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
            onClick={() => router.push(returnUrl)}
            className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </nav>

      <main className="container mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-sage-900">
            LDS Church Membership Records Request
          </h1>
          <p className="text-lg text-sage-700">
            Fill out this form to request that The Church of Jesus Christ of
            Latter-day Saints
            <br />
            send your membership records to the Department of Justice
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-terracotta-400"></div>
        </div>

        {/* Instructions */}
        <Card className="mb-8 rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-6 w-6" />
              How This Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-800">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                1
              </div>
              <p>
                <strong>Fill out the form below</strong> with your information
                and details about the person (Downwinder) for whom you're making
                the request
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                2
              </div>
              <div>
                <p className="mb-2">
                  <strong>Save the filled form:</strong>
                </p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>
                    • Look for the{" "}
                    <strong>
                      download button in your browser's PDF toolbar
                    </strong>{" "}
                    (usually in the top-right of the PDF viewer)
                  </li>
                  <li>
                    • When saving, make sure to select{" "}
                    <strong>"Save with changes"</strong> or similar option to
                    preserve your filled data
                  </li>
                  <li>
                    • Alternative: Use the <strong>"Print" button</strong> in
                    the toolbar and select "Print to PDF" to save your filled
                    form
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                3
              </div>
              <p>
                <strong>Print the saved form and sign it</strong> - Your
                physical signature is required in the "Agreement and Signature"
                section
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                4
              </div>
              <div>
                <p className="mb-2">
                  <strong>Mail the signed form to:</strong>
                </p>
                <div className="rounded-lg bg-white p-3 font-mono text-xs">
                  RECA RESEARCH
                  <br />
                  Global Services Department
                  <br />
                  3740 West Market Center Drive
                  <br />
                  Riverton, UT 84065
                  <br />
                  <span className="mt-1 block text-blue-700">
                    Phone: 1-801-240-3500
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                5
              </div>
              <p>
                The Church will check their historical records and{" "}
                <strong>
                  send a report directly to the U.S. Department of Justice
                </strong>{" "}
                to support your RECA claim. They will also send a copy to you.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2 rounded-full border-2 border-sage-300 bg-white px-6 py-3 text-base text-sage-700 hover:bg-sage-50"
          >
            <Download className="h-5 w-5" />
            Download Blank Form
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2 rounded-full border-2 border-sage-300 bg-white px-6 py-3 text-base text-sage-700 hover:bg-sage-50"
          >
            <Printer className="h-5 w-5" />
            Open Blank Form
          </Button>
        </div>

        {/* Helpful Note */}
        <div className="mb-4 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <p className="text-center text-sm text-green-800">
            <strong>
              👇 Fill out the form below, then use the PDF toolbar's
              download/print button and select "Save with changes" to preserve
              your data
            </strong>
          </p>
        </div>

        {/* PDF Viewer */}
        {isClient && (
          <Card className="overflow-hidden rounded-3xl border-2 border-cream-200 shadow-lg">
            <CardContent className="p-0">
              <div
                className="relative"
                style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}
              >
                <iframe
                  src="/forms/lds-reca-form-2025.pdf"
                  className="h-full w-full"
                  title="LDS RECA Form"
                  style={{ border: "none" }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Notes */}
        <div className="mt-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-cream-100 p-6">
          <div className="flex gap-4">
            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-700" />
            <div>
              <h3 className="mb-2 font-semibold text-amber-900">
                Important Notes
              </h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>Saving Your Filled Form:</strong> After filling out
                    the form in the viewer, use your browser's PDF toolbar
                    (download or print button) and select "Save with changes" to
                    preserve your filled data. The buttons at the top of this
                    page open blank forms.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>Signature Required:</strong> You must print, sign,
                    and mail the physical form. Digital signatures are not
                    accepted.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>Direct to DOJ:</strong> The Church will NOT email
                    you the records. They send the report directly to the
                    Department of Justice.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>Processing Time:</strong> Allow several weeks for
                    the Church to research records and send their report.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>Free Service:</strong> This service is provided free
                    of charge by the Church.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Return Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => router.push(returnUrl)}
            variant="outline"
            className="gap-2 rounded-full border-sage-300 px-8 py-6 text-lg text-sage-700 hover:bg-sage-50"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Document Upload
          </Button>
        </div>
      </main>
    </div>
  );
}
