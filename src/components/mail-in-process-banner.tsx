"use client";

import { Info, Upload, CheckCircle, Mail, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Banner explaining the mail-in adjustment process
 * Shows why clients upload digital copies first, then mail originals
 */
export function MailInProcessBanner() {
  return (
    <Card className="mb-8 overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Info className="h-6 w-6 text-blue-700" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="mb-3 text-xl font-bold text-blue-900">
              Important: How Our Document Process Works
            </h3>

            <p className="mb-4 text-sm text-blue-800">
              The Department of Justice requires certain documents to be
              submitted as <strong>certified copies or originals</strong>. Until
              the new digital portal opens, we're using this streamlined process
              to make things easier for you:
            </p>

            {/* Process Steps */}
            <div className="space-y-3">
              <div className="flex gap-3 rounded-lg bg-white/60 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      Upload Digital Copies
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Take photos or scans of all your documents and upload them
                    here. Don't worry about getting certified copies yet!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg bg-white/60 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      We Validate & Review
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Our team reviews your uploads to ensure everything is
                    complete and correct. Then our lawyer reviews printed copies
                    for approval.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg bg-white/60 p-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      You Mail the Originals
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Once approved, we'll send you a prepaid envelope and clear
                    instructions. You'll replace our printed copies with your
                    certified copies/originals and mail to the DOJ.
                  </p>
                </div>
              </div>
            </div>

            {/* Why This Approach */}
            <div className="mt-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-900">
                    Why This Works Better
                  </h4>
                  <p className="mt-1 text-xs text-emerald-800">
                    This ensures your documents are complete and correct{" "}
                    <em>before</em> you go through the effort of obtaining
                    certified copies. It saves you time and helps us catch any
                    issues early. It's more convenient and service-oriented!
                  </p>
                </div>
              </div>
            </div>

            {/* Temporary Process Note */}
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                <strong>Note:</strong> This process is temporary until the DOJ
                digital portal launches. We'll shift to fully digital submission
                as soon as it's available.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
