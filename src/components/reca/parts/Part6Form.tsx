"use client";

import React, { useEffect } from "react";
import { Part6SurvivingChild } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

interface Part6FormProps {
  initialData?: Partial<Part6SurvivingChild>;
  onSubmit: (data: Part6SurvivingChild) => void;
}

export default function Part6Form({ initialData, onSubmit }: Part6FormProps) {
  // Auto-submit with minimal data for now
  useEffect(() => {
    onSubmit({
      claimantDeceased: initialData?.claimantDeceased || "YES",
      claimantEverMarried: initialData?.claimantEverMarried || "NO",
      childType: initialData?.childType || "NATURAL",
      otherChildrenExist: initialData?.otherChildrenExist || "NO",
    });
  }, [initialData, onSubmit]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sage-700">
              <p className="font-semibold mb-1">Part 6: Surviving Child</p>
              <p>
                This section collects information for children of the person who became
                ill. Full form implementation coming soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">Surviving Child Information</CardTitle>
          <CardDescription className="text-sage-600">
            For natural, adopted, or step-children
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Form Under Construction
            </h3>
            <p className="text-sm text-blue-800">
              The detailed form for surviving children is being implemented. For now,
              you can proceed to the next section. Required information includes:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-800">
              <li>• Confirmation that the person who became ill is deceased</li>
              <li>• Marriage history of the person who became ill</li>
              <li>• Your relationship type (natural, adopted, or step-child)</li>
              <li>• Information about all siblings</li>
              <li>• Birth, death, and marriage certificates</li>
            </ul>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs font-semibold text-amber-900">Important:</p>
              <p className="text-xs text-amber-800 mt-1">
                Awards are shared equally among all eligible surviving children.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
