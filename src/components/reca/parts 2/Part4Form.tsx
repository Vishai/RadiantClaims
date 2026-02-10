"use client";

import React, { useEffect } from "react";
import { Part4SelfFiler } from "@/lib/reca/types";

interface Part4FormProps {
  initialData?: Partial<Part4SelfFiler>;
  onSubmit: (data: Part4SelfFiler) => void;
}

export default function Part4Form({ initialData, onSubmit }: Part4FormProps) {
  // Auto-submit with default data for backwards compatibility
  useEffect(() => {
    onSubmit({
      hasNameChanges: false,
      ...initialData,
    });
  }, [onSubmit, initialData]);

  // Expose form submission to FormWizard (always valid for Part 4)
  useEffect(() => {
    (window as any).__currentFormSubmit = async () => {
      await onSubmit({
        hasNameChanges: false,
        ...initialData,
      });
      return true; // Always valid
    };

    return () => {
      delete (window as any).__currentFormSubmit;
    };
  }, [onSubmit, initialData]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Part 4: Self-Filers
        </h2>
        <p className="text-sm text-gray-600">
          For individuals who became ill and are filing for themselves
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start space-x-3">
          <div className="mt-1 flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              You are filing for yourself
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              As a self-filer, you do not need to fill out any additional fields
              in this section. However, you will need to provide specific
              documents to support your claim.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Required Documents
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Unless filing electronically, provide certified or original copies of
          the following:
        </p>
        <ul className="space-y-3">
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <span className="text-xs font-semibold text-amber-700">1</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Birth Certificate (yours)
              </p>
              <p className="mt-1 text-xs text-gray-500">Required</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <span className="text-xs font-semibold text-amber-700">2</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Marriage Certificate(s)
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Only if you provided former names in Part 1. Documents all name
                changes.
              </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 flex items-center text-lg font-semibold text-gray-900">
          <svg
            className="mr-2 h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          What Happens Next
        </h3>
        <p className="text-sm text-gray-600">
          Click <strong>Next</strong> to continue to Part 8: Exposure
          Information, where you will provide details about your physical
          presence in designated affected areas during the testing period.
        </p>
      </div>
    </div>
  );
}
