"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ChevronRight,
  HelpCircle,
  Clock,
  Phone,
  Globe,
  Mail,
} from "lucide-react";
import { RECAWorkflowState } from "@/lib/reca/types";
import {
  generateDocumentRequirements,
  getDocumentAssistance,
} from "@/lib/reca/document-tracking";
import { generateReviewChecklist } from "@/lib/reca/review-tracking";

interface ApplicationRecapProps {
  workflowState: RECAWorkflowState;
  onNavigateToSection: (sectionId: string) => void;
  onDownloadChecklist: () => void;
  onRequestHelp: (documentId: string) => void;
}

interface MissingItem {
  sectionId: string;
  sectionName: string;
  fieldLabel: string;
  importance: "required" | "recommended" | "optional";
  impact: string;
}

interface DocumentNeed {
  id: string;
  name: string;
  reason: string;
  status: "needed" | "in_progress" | "obtained";
  help: {
    where: string;
    time: string;
    alternatives?: string[];
  };
}

export function ApplicationRecap({
  workflowState,
  onNavigateToSection,
  onDownloadChecklist,
  onRequestHelp,
}: ApplicationRecapProps) {
  const [completeSections, setCompleteSections] = useState<string[]>([]);
  const [incompleteSections, setIncompleteSections] = useState<MissingItem[]>(
    []
  );
  const [documentNeeds, setDocumentNeeds] = useState<DocumentNeed[]>([]);
  const [overallCompletion, setOverallCompletion] = useState(0);

  useEffect(() => {
    // Analyze workflow state to determine completion
    analyzeCompletion();
  }, [workflowState]);

  const analyzeCompletion = () => {
    // This would analyze the actual workflow state
    // For now, using example data
    setCompleteSections([
      "Part 1: Your Information",
      "Part 3: Relationship",
      "Part 8: Exposure Information",
    ]);

    setIncompleteSections([
      {
        sectionId: "part_2",
        sectionName: "Part 2: Claimant Information",
        fieldLabel: "Date of Birth, Social Security Number",
        importance: "required",
        impact: "Required for DOJ submission",
      },
      {
        sectionId: "part_4",
        sectionName: "Part 4: Self-Filer Documentation",
        fieldLabel: "Name change information",
        importance: "recommended",
        impact: "Determines which documents you'll need",
      },
    ]);

    setDocumentNeeds([
      {
        id: "birth_cert",
        name: "Birth Certificate (yours)",
        reason: "Required to establish identity",
        status: "needed",
        help: {
          where: "State vital records office or VitalChek.com",
          time: "3-5 business days (expedited) or 2-3 weeks (standard)",
          alternatives: ["Passport", "Military ID with birth information"],
        },
      },
      {
        id: "marriage_certs",
        name: "Marriage Certificates (2 copies)",
        reason: "To document name changes from marriages",
        status: "needed",
        help: {
          where: "County clerk where married",
          time: "Same day (in person) or 1-2 weeks (mail)",
        },
      },
    ]);

    setOverallCompletion(75);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header with Overall Progress */}
      <Card className="border-2 border-sage-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Application Review</CardTitle>
              <CardDescription className="mt-2">
                Great progress! Here's what we've captured and what's still
                needed.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-sage-900">
                {overallCompletion}%
              </div>
              <div className="text-sm text-sage-600">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallCompletion} className="h-3" />
          <div className="mt-2 flex justify-between text-sm text-sage-600">
            <span>Start</span>
            <span>Ready for submission</span>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Form Sections */}
        <div className="space-y-6">
          {/* Complete Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Complete Sections ({completeSections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completeSections.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
                  >
                    <span className="text-sm font-medium text-green-900">
                      {section}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incomplete Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Sections Needing Attention ({incompleteSections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-2">
                {incompleteSections.map((item, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.importance === "required"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.importance}
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.sectionName}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-4">
                        <div>
                          <p className="text-sm font-medium text-sage-700">
                            Missing Information:
                          </p>
                          <p className="text-sm text-sage-600">
                            {item.fieldLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-sage-700">
                            Impact:
                          </p>
                          <p className="text-sm text-sage-600">{item.impact}</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => onNavigateToSection(item.sectionId)}
                          >
                            Complete Now
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRequestHelp(item.sectionId)}
                          >
                            <HelpCircle className="mr-1 h-4 w-4" />
                            Get Help
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Documents You'll Need
              </CardTitle>
              <CardDescription>
                Based on your responses, these documents are required for your
                application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentNeeds.map((doc, idx) => (
                  <Card key={idx} className="border border-blue-200">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sage-900">
                              {doc.name}
                            </h4>
                            <p className="mt-1 text-sm text-sage-600">
                              {doc.reason}
                            </p>
                          </div>
                          <Badge
                            variant={
                              doc.status === "obtained"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <div className="flex items-start gap-2">
                            <Globe className="mt-0.5 h-4 w-4 text-sage-500" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-sage-700">
                                Where to get:
                              </p>
                              <p className="text-xs text-sage-600">
                                {doc.help.where}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Clock className="mt-0.5 h-4 w-4 text-sage-500" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-sage-700">
                                Processing time:
                              </p>
                              <p className="text-xs text-sage-600">
                                {doc.help.time}
                              </p>
                            </div>
                          </div>

                          {doc.help.alternatives && (
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 text-sage-500" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-sage-700">
                                  Alternatives:
                                </p>
                                <ul className="text-xs text-sage-600">
                                  {doc.help.alternatives.map((alt, i) => (
                                    <li key={i}>• {alt}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => onRequestHelp(doc.id)}
                        >
                          Get Detailed Help
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={onDownloadChecklist}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Complete Checklist
              </Button>
            </CardContent>
          </Card>

          {/* Help Resources */}
          <Card className="border-2 border-sage-200">
            <CardHeader>
              <CardTitle className="text-lg">Need Assistance?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="mr-2 h-4 w-4" />
                Call Support: 1-800-729-7327
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Email: support@radiantclaims.com
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="mr-2 h-4 w-4" />
                View Help Center
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <Card className="border-2 border-terracotta-200 bg-gradient-to-r from-terracotta-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-terracotta-900">
                Ready to Continue?
              </h3>
              <p className="mt-1 text-sm text-terracotta-700">
                You can return to complete missing sections or save your
                progress for later.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Save and Exit</Button>
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                Return to Application
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
