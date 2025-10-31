"use client";

import React, { useEffect } from "react";
import { Part5SurvivingSpouse } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

interface Part5FormProps {
  initialData?: Partial<Part5SurvivingSpouse>;
  onSubmit: (data: Part5SurvivingSpouse) => void;
}

export default function Part5Form({ initialData, onSubmit }: Part5FormProps) {
  // Auto-submit with minimal data for now
  useEffect(() => {
    onSubmit({
      claimantDeceased: initialData?.claimantDeceased || "YES",
      marriedOneYear: initialData?.marriedOneYear || "YES",
      claimantPreviousMarriages: initialData?.claimantPreviousMarriages || "NO",
      filerOtherMarriages: initialData?.filerOtherMarriages || "NO",
    });
  }, [initialData, onSubmit]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="text-sm text-sage-700">
              <p className="mb-1 font-semibold">Part 5: Surviving Spouse</p>
              <p>
                This section collects information about your marriage to the
                person who became ill. Full form implementation coming soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Surviving Spouse Information
          </CardTitle>
          <CardDescription className="text-sage-600">
            For individuals married to the person who became ill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">
              Form Under Construction
            </h3>
            <p className="text-sm text-blue-800">
              The detailed form for surviving spouses is being implemented. For
              now, you can proceed to the next section. Required information
              includes:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-800">
              <li>• Confirmation that the person who became ill is deceased</li>
              <li>• Confirmation of 1+ year marriage before death</li>
              <li>• Information about previous marriages (if any)</li>
              <li>• Death and marriage certificates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
