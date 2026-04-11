"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Puzzle,
  CheckCircle,
  ChevronUp,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

const STORAGE_KEY = "rc-filing-flow-dismissed";
const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/kdbankgnojlkljikngcmcfopiakkdmhe";

const STEPS = [
  {
    number: 1,
    title: "Prepare Here",
    description:
      "Fill out your RECA form, upload supporting documents, and we'll build a personalized checklist of exactly what the DOJ needs based on your situation.",
    icon: FileText,
    circleClass: "border-sage-500 bg-sage-50 text-sage-600",
    titleClass: "text-sage-800",
  },
  {
    number: 2,
    title: "File on DOJ.gov",
    description:
      "When you're ready, you'll file your claim on the official DOJ website. Our Chrome extension auto-fills your data so you don't have to retype anything.",
    icon: Puzzle,
    circleClass: "border-purple-500 bg-purple-50 text-purple-600",
    titleClass: "text-purple-800",
  },
  {
    number: 3,
    title: "Track Your Claim",
    description:
      "After filing, come back here to record your DOJ claim number and track your claim status.",
    icon: CheckCircle,
    circleClass: "border-terracotta-500 bg-terracotta-50 text-terracotta-600",
    titleClass: "text-terracotta-800",
  },
] as const;

export function FilingFlowEducation() {
  const [expanded, setExpanded] = useState<boolean | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    setExpanded(!dismissed);
  }, []);

  // Don't render until we've read localStorage to avoid flash
  if (expanded === null) return null;

  const handleDismiss = () => {
    setExpanded(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleReExpand = () => {
    setExpanded(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!expanded) {
    return (
      <button
        onClick={handleReExpand}
        className="mb-4 flex items-center gap-1.5 text-sm text-sage-500 transition-colors hover:text-sage-700"
      >
        <HelpCircle className="h-4 w-4" />
        How does filing work?
      </button>
    );
  }

  return (
    <Card className="mb-8 rounded-3xl border-2 border-cream-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sage-900">How Filing Works</CardTitle>
            <p className="mt-1 text-sm text-sage-600">
              RadiantClaims helps you <strong>prepare</strong> your claim. The
              actual filing happens on the DOJ&apos;s official website.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 text-sage-400 hover:text-sage-600"
            title="Dismiss"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 3-step flow */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center"
              >
                <div className="flex items-center sm:w-full">
                  {/* Connector left (desktop only) */}
                  {index > 0 && (
                    <div className="hidden h-0.5 flex-1 border-t-2 border-dashed border-cream-300 sm:block" />
                  )}

                  {/* Circle */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${step.circleClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Connector right (desktop only) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden h-0.5 flex-1 border-t-2 border-dashed border-cream-300 sm:block" />
                  )}
                </div>

                <div className="sm:mt-2 sm:px-2">
                  <p className={`text-sm font-semibold ${step.titleClass}`}>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-sage-600">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chrome extension callout */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-200 bg-purple-50/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-purple-100 p-1.5">
              <Puzzle className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-900">
                RadiantClaims Filing Assistant for Chrome
              </p>
              <p className="text-xs text-purple-700">
                Auto-fills DOJ forms with your data — no retyping needed
              </p>
            </div>
          </div>
          <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Install Extension
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
