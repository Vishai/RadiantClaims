/**
 * Document Requirements Checklist Component
 *
 * Displays dynamically generated document requirements based on form data.
 * Shows upload status, provides context, and highlights missing documents.
 */

'use client';

import { useMemo } from 'react';
import {
  analyzeDocumentRequirements,
  getRequirementsByCategory,
  getCategoryDisplayName,
  getPriorityColor,
  type DocumentRequirement,
  type DocumentCategory,
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
import { Button } from '@/components/ui/button';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

export interface DocumentRequirementsChecklistProps {
  formData: Partial<RECAFormData>;
  uploadedFiles?: Record<string, boolean>;
  onUpload?: (requirementId: string) => void;
  showCategories?: boolean;
  compactMode?: boolean;
}

export function DocumentRequirementsChecklist({
  formData,
  uploadedFiles = {},
  onUpload,
  showCategories = true,
  compactMode = false,
}: DocumentRequirementsChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<DocumentCategory>>(
    new Set<DocumentCategory>(['CLAIMANT_VITAL_RECORDS', 'RELATIONSHIP_PROOF'])
  );

  // Analyze requirements
  const analysis = useMemo(
    () => analyzeDocumentRequirements(formData, uploadedFiles),
    [formData, uploadedFiles]
  );

  // Group by category
  const categories = useMemo(() => {
    const cats: DocumentCategory[] = [
      'CLAIMANT_VITAL_RECORDS',
      'RELATIONSHIP_PROOF',
      'SIBLING_VITAL_RECORDS',
      'SPOUSE_MARRIAGE',
      'CLAIMANT_MEDICAL',
      'FILER_IDENTITY',
      'EXPOSURE_PROOF',
      'OTHER',
    ];

    return cats
      .map(cat => ({
        category: cat,
        requirements: getRequirementsByCategory(analysis, cat),
      }))
      .filter(c => c.requirements.length > 0);
  }, [analysis]);

  const toggleCategory = (category: DocumentCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (analysis.requirements.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                No Documents Required Yet
              </p>
              <p className="text-sm text-blue-800">
                Complete more of the application to see required documents.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FileText className="h-5 w-5 text-terracotta-500" />
            Document Requirements
          </CardTitle>
          <CardDescription>
            Based on your application, you need {analysis.requiredCount} required documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-sage-900">
                {analysis.uploadedCount} of {analysis.requiredCount} uploaded
              </span>
              <span className="text-sage-600">
                {analysis.completionPercentage}% complete
              </span>
            </div>
            <Progress value={analysis.completionPercentage} className="h-2" />
          </div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="space-y-2">
              {analysis.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">{warning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">
                {analysis.missingRequired.length}
              </div>
              <div className="text-xs text-red-600">Missing</div>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {analysis.uploadedCount}
              </div>
              <div className="text-xs text-green-600">Uploaded</div>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {analysis.requirements.filter(r => r.priority === 'RECOMMENDED').length}
              </div>
              <div className="text-xs text-blue-600">Recommended</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {showCategories ? (
        // Grouped by category
        <div className="space-y-4">
          {categories.map(({ category, requirements }) => (
            <Card key={category} className="border-cream-200">
              <CardHeader
                className="cursor-pointer hover:bg-cream-50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-sage-900">
                      {getCategoryDisplayName(category)}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {requirements.length}
                    </Badge>
                  </div>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="h-5 w-5 text-sage-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-sage-600" />
                  )}
                </div>
              </CardHeader>

              {expandedCategories.has(category) && (
                <CardContent className="space-y-3">
                  {requirements.map(req => (
                    <DocumentRequirementCard
                      key={req.id}
                      requirement={req}
                      onUpload={onUpload}
                      compact={compactMode}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // Flat list
        <div className="space-y-3">
          {analysis.requirements.map(req => (
            <DocumentRequirementCard
              key={req.id}
              requirement={req}
              onUpload={onUpload}
              compact={compactMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentRequirementCardProps {
  requirement: DocumentRequirement;
  onUpload?: (requirementId: string) => void;
  compact?: boolean;
}

function DocumentRequirementCard({
  requirement,
  onUpload,
}: DocumentRequirementCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const priorityColors = getPriorityColor(requirement.priority);

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        requirement.isUploaded
          ? 'border-green-200 bg-green-50/30'
          : requirement.priority === 'REQUIRED'
          ? 'border-red-200 bg-red-50/30'
          : priorityColors.border + ' ' + priorityColors.bg
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {requirement.isUploaded ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : requirement.priority === 'REQUIRED' ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <FileText className="h-6 w-6 text-sage-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sage-900 mb-1">
                  {requirement.title}
                </h4>
                <p className="text-sm text-sage-700">
                  {requirement.description}
                </p>
              </div>

              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={`${priorityColors.text} ${priorityColors.border} text-xs flex-shrink-0`}
              >
                {requirement.priority}
              </Badge>
            </div>

            {/* Reason */}
            <div className="mt-2 rounded-lg bg-white/50 border border-sage-200 p-3">
              <p className="text-sm text-sage-800">
                <span className="font-semibold">Why needed:</span> {requirement.reason}
              </p>
              {requirement.conditionalReason && (
                <p className="text-sm text-sage-700 mt-1">
                  {requirement.conditionalReason}
                </p>
              )}
            </div>

            {/* Tips (expandable) */}
            {requirement.tips && requirement.tips.length > 0 && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-auto p-0 text-sm text-blue-700 hover:text-blue-800 hover:bg-transparent"
                >
                  <Info className="h-4 w-4 mr-1" />
                  {showDetails ? 'Hide' : 'Show'} helpful tips
                </Button>

                {showDetails && (
                  <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Helpful Tips:
                    </p>
                    <ul className="space-y-1 text-sm text-blue-800">
                      {requirement.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Upload Button */}
            {!requirement.isUploaded && onUpload && (
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => onUpload(requirement.id)}
                  variant={requirement.priority === 'REQUIRED' ? 'default' : 'outline'}
                  size="sm"
                  className={requirement.priority === 'REQUIRED' ? 'bg-terracotta-600 hover:bg-terracotta-700' : ''}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}

            {/* Uploaded Status */}
            {requirement.isUploaded && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">Document uploaded</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for sidebars or summaries
 */
export function DocumentRequirementsSummary({
  formData,
  uploadedFiles = {},
}: Omit<DocumentRequirementsChecklistProps, 'onUpload' | 'showCategories' | 'compactMode'>) {
  const analysis = useMemo(
    () => analyzeDocumentRequirements(formData, uploadedFiles),
    [formData, uploadedFiles]
  );

  if (analysis.requirements.length === 0) {
    return null;
  }

  return (
    <Card className="border-sage-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-sage-900">
          Document Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-sage-700">Required Documents</span>
          <span className="font-semibold text-sage-900">
            {analysis.uploadedCount}/{analysis.requiredCount}
          </span>
        </div>

        <Progress value={analysis.completionPercentage} className="h-2" />

        {analysis.missingRequired.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-700">
                {analysis.missingRequired.length} required document{analysis.missingRequired.length > 1 ? 's' : ''} missing
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
