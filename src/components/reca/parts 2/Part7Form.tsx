"use client";

import React, { useEffect } from "react";
import { Part7OtherRelatives } from "@/lib/reca/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info } from "lucide-react";

interface Part7FormProps {
  initialData?: Partial<Part7OtherRelatives>;
  onSubmit: (data: Part7OtherRelatives) => void;
}

export default function Part7Form({ initialData, onSubmit }: Part7FormProps) {
  // Auto-submit with minimal data for now
  useEffect(() => {
    onSubmit({
      relationshipType: initialData?.relationshipType || "PARENT",
    });
  }, [initialData, onSubmit]);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="text-sm text-sage-700">
              <p className="mb-1 font-semibold">
                Part 7: Parents, Grandchildren, or Grandparents
              </p>
              <p>
                RECA staff will contact you for additional assistance in
                establishing your relationship. Full form implementation coming
                soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sage-900">
            Other Relatives Information
          </CardTitle>
          <CardDescription className="text-sage-600">
            For parents, grandchildren, or grandparents of the person who became
            ill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">
              Form Under Construction
            </h3>
            <p className="text-sm text-blue-800">
              The detailed form for other relatives is being implemented. For
              now, you can proceed to the next section. Initial requirements
              include:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-800">
              <li>• Birth certificate of the person who became ill</li>
              <li>• Death certificate of the person who became ill</li>
              <li>• Marriage certificate(s) of the person who became ill</li>
              <li>• Your birth certificate or adoption papers</li>
            </ul>
            <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs font-semibold text-yellow-900">
                Follow-up Required:
              </p>
              <p className="mt-1 text-xs text-yellow-800">
                RECA staff will contact you to request additional documents
                necessary to establish your eligibility and relationship.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
