/**
 * Inline Document Requirements Component
 *
 * Shows document requirements within form sections based on current form data.
 * Provides real-time feedback about what documents will be needed.
 */

'use client';

import { useMemo } from 'react';
import {
  analyzeDocumentRequirements,
  type DocumentRequirement,
} from '@/lib/reca/document-requirements';
import type { RECAFormData } from '@/lib/reca/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DocumentRequirementsInlineProps {
  formData: Partial<RECAFormData>;
  uploadedFiles?: Record<string, boolean>;
  relatedFormSection?: string;
  title?: string;
  description?: string;
  variant?: 'card' | 'compact' | 'minimal';
  showUploadedStatus?: boolean;
}

/**
 * Inline component for showing document requirements within forms
 */
export function DocumentRequirementsInline({
  formData,
  uploadedFiles = {},
  relatedFormSection,
  title = 'Documents You\'ll Need',
  description = 'Based on your answers, you\'ll need to upload these documents later',
  variant = 'card',
  showUploadedStatus = false,
}: DocumentRequirementsInlineProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Analyze requirements
  const analysis = useMemo(
    () => analyzeDocumentRequirements(formData, uploadedFiles),
    [formData, uploadedFiles]
  );

  // Filter to relevant section if specified
  const relevantRequirements = useMemo(() => {
    if (!relatedFormSection) {
      return analysis.requirements;
    }
    return analysis.requirements.filter(
      r => r.relatedFormSection === relatedFormSection
    );
  }, [analysis.requirements, relatedFormSection]);

  // Don't show if no requirements
  if (relevantRequirements.length === 0) {
    return null;
  }

  const requiredDocs = relevantRequirements.filter(r => r.priority === 'REQUIRED');
  const uploadedDocs = requiredDocs.filter(r => r.isUploaded);

  // Minimal variant - just a count badge
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <FileText className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-blue-900">
          {requiredDocs.length} document{requiredDocs.length !== 1 ? 's' : ''} will be needed from this section
        </span>
      </div>
    );
  }

  // Compact variant - simple list
  if (variant === 'compact') {
    return (
      <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              {title}
            </h4>
            <ul className="space-y-1.5">
              {relevantRequirements.map(req => (
                <li key={req.id} className="flex items-start gap-2 text-sm text-blue-800">
                  {req.isUploaded ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : req.priority === 'REQUIRED' ? (
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{req.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Full card variant
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 text-left">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-base text-blue-900">
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-blue-700 mt-1">
                  {description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-white">
                {requiredDocs.length} document{requiredDocs.length !== 1 ? 's' : ''}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {showUploadedStatus && uploadedDocs.length > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    {uploadedDocs.length} of {requiredDocs.length} already uploaded
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {relevantRequirements.map(req => (
                <DocumentRequirementInlineCard
                  key={req.id}
                  requirement={req}
                  showUploadedStatus={showUploadedStatus}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface DocumentRequirementInlineCardProps {
  requirement: DocumentRequirement;
  showUploadedStatus: boolean;
}

function DocumentRequirementInlineCard({
  requirement,
  showUploadedStatus,
}: DocumentRequirementInlineCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        requirement.isUploaded
          ? 'border-green-200 bg-green-50/50'
          : requirement.priority === 'REQUIRED'
          ? 'border-red-200 bg-red-50/30'
          : 'border-amber-200 bg-amber-50/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {requirement.isUploaded ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : requirement.priority === 'REQUIRED' ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <FileText className="h-5 w-5 text-amber-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h5 className="font-semibold text-sm text-sage-900">
              {requirement.title}
            </h5>
            <Badge
              variant="outline"
              className={`text-xs flex-shrink-0 ${
                requirement.priority === 'REQUIRED'
                  ? 'border-red-300 text-red-700'
                  : requirement.priority === 'RECOMMENDED'
                  ? 'border-amber-300 text-amber-700'
                  : 'border-blue-300 text-blue-700'
              }`}
            >
              {requirement.priority}
            </Badge>
          </div>

          <p className="text-sm text-sage-700 mb-2">
            {requirement.description}
          </p>

          <div className="rounded bg-white/70 border border-sage-200 p-2">
            <p className="text-xs text-sage-800">
              <span className="font-semibold">Why needed:</span> {requirement.reason}
            </p>
            {requirement.conditionalReason && (
              <p className="text-xs text-sage-700 mt-1">
                {requirement.conditionalReason}
              </p>
            )}
          </div>

          {showUploadedStatus && requirement.isUploaded && (
            <div className="mt-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">
                Document uploaded
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Summary badge for showing document count in form headers
 */
export function DocumentRequirementsBadge({
  formData,
  relatedFormSection,
}: {
  formData: Partial<RECAFormData>;
  relatedFormSection: string;
}) {
  const analysis = useMemo(
    () => analyzeDocumentRequirements(formData),
    [formData]
  );

  const relevantRequirements = analysis.requirements.filter(
    r => r.relatedFormSection === relatedFormSection
  );

  if (relevantRequirements.length === 0) {
    return null;
  }

  const requiredCount = relevantRequirements.filter(
    r => r.priority === 'REQUIRED'
  ).length;

  return (
    <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
      <FileText className="h-3 w-3 mr-1" />
      {requiredCount} doc{requiredCount !== 1 ? 's' : ''} needed
    </Badge>
  );
}
