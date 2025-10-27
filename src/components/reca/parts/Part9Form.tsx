"use client";

import { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Info, CheckCircle2, Upload } from "lucide-react";

// Validation schema
const part9Schema = z.object({
  ldsChurchAssistance: z.boolean().optional(),
});

type Part9FormData = z.infer<typeof part9Schema>;

interface Part9FormProps {
  initialData?: Partial<Part9ProofOfPresence>;
  onSubmit: (data: Part9ProofOfPresence) => void;
}

export default function Part9Form({ initialData, onSubmit }: Part9FormProps) {
  const form = useForm<Part9FormData>({
    resolver: zodResolver(part9Schema),
    defaultValues: {
      ldsChurchAssistance: initialData?.ldsChurchAssistance || false,
    },
  });

  // Auto-submit when form data changes
  useEffect(() => {
    const subscription = form.watch(() => {
      const values = form.getValues();
      onSubmit(values as Part9ProofOfPresence);
    });
    return () => subscription.unsubscribe();
  }, [form, onSubmit]);

  const ldsChurchAssistance = form.watch("ldsChurchAssistance");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Part 9: Proof of Presence in an Affected Area
          </CardTitle>
          <CardDescription>
            Documentation methods to establish physical presence in affected areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acceptable Documents Info */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-2">
                  Acceptable Documentation Types
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  Documents must show the name of the person who became ill (or an immediate family
                  member in the same household), residence or employment in an affected area, and
                  a specific date.
                </p>
              </div>
            </div>
          </div>

          {/* Document Types Checklist */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-sage-900">
              Types of Documents You Can Submit
            </Label>

            <div className="grid gap-3">
              {[
                { icon: CheckCircle2, label: "Tax Records" },
                { icon: CheckCircle2, label: "School Records" },
                { icon: CheckCircle2, label: "Employment Records" },
                { icon: CheckCircle2, label: "Birth and Marriage Records" },
                { icon: CheckCircle2, label: "Personal Letters or Envelopes (with postmark)" },
                { icon: CheckCircle2, label: "Church/Religious Records" },
                { icon: CheckCircle2, label: "Voting Records" },
                { icon: CheckCircle2, label: "Personal Diaries" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-md border border-sage-200 p-3 bg-white"
                >
                  <item.icon className="h-5 w-5 text-terracotta-500 flex-shrink-0" />
                  <span className="text-sm text-sage-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Requirements */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-2">
                  Certification Requirements
                </p>
                <div className="text-sm text-amber-800 space-y-2">
                  <p>
                    <strong>Electronic Filing:</strong> Photocopies are acceptable
                  </p>
                  <p>
                    <strong>Mail Filing:</strong> Documents must be certified or original
                  </p>
                  <p className="mt-3 font-medium">Certification Methods:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Certified photocopies stamped with institutional seal (raised, colored, or
                      signed)
                    </li>
                    <li>
                      Cover letter on letterhead from record source stating "true and accurate copy"
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* LDS Church Assistance Checkbox */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Church of Jesus Christ of Latter-day Saints Records
            </Label>

            <div className="flex items-start gap-3 rounded-md border border-sage-200 p-4 bg-white">
              <Checkbox
                id="ldsChurchAssistance"
                checked={ldsChurchAssistance}
                onCheckedChange={(checked) =>
                  form.setValue("ldsChurchAssistance", checked as boolean)
                }
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor="ldsChurchAssistance"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I have contacted the Church of Jesus Christ of Latter-day Saints and requested
                  information regarding my claim
                </label>
                <div className="mt-3 text-sm text-sage-600 space-y-2">
                  <p className="font-medium">Contact Information:</p>
                  <p>
                    <strong>Phone:</strong> (801) 240-3500
                  </p>
                  <p>
                    <strong>Address:</strong>
                    <br />
                    Member and Statistical Records Division
                    <br />
                    17th Floor, 50 East North Temple Street
                    <br />
                    Salt Lake City, UT 84150
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Placeholder */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold text-sage-900">
              Document Upload
            </Label>

            <div className="rounded-lg border-2 border-dashed border-sage-300 p-8 text-center">
              <Upload className="h-12 w-12 text-sage-400 mx-auto mb-4" />
              <p className="text-sage-700 font-medium mb-2">
                Document Upload Coming Soon
              </p>
              <p className="text-sm text-sage-600 max-w-md mx-auto">
                You will be able to upload your proof of presence documents in a future step.
                For now, please ensure you have gathered the necessary documentation listed above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents Reminder */}
      <Card className="border-terracotta-200 bg-terracotta-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-terracotta-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-terracotta-900 mb-2">
                What to Prepare
              </p>
              <p className="text-sm text-terracotta-800 mb-3">
                Gather documents that prove physical presence in the affected areas during the
                time periods you specified in Part 8. Each document should clearly show:
              </p>
              <ul className="text-sm text-terracotta-800 space-y-1 list-disc list-inside">
                <li>
                  The name of the person who became ill (or immediate family member living in the
                  same household)
                </li>
                <li>The affected area location (city, town, county, state)</li>
                <li>A specific date or date range within the eligible exposure periods</li>
              </ul>
              <p className="text-sm text-terracotta-800 mt-3">
                <strong>Tip:</strong> Submit multiple types of documents to strengthen your claim.
                The more documentation you provide, the easier it will be to establish presence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Helper */}
      <Card className="border-sage-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-sage-700">
                After completing this section, you will move on to Part 10 where you will select
                the compensable disease(s) that the claimant developed. This form auto-saves your
                progress, so you can safely navigate away and return later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
