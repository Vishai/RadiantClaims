/**
 * RECA Document Dashboard
 *
 * Comprehensive document management dashboard for RECA claims.
 * Combines:
 * - Document requirements analysis (what documents are needed)
 * - Document upload and management (existing infrastructure)
 * - Progress tracking and completion status
 * - Document validation and review
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  analyzeDocumentRequirements,
  type DocumentRequirement,
  getCategoryDisplayName,
} from '@/lib/reca/document-requirements';
import type { RECAFormData } from '@/lib/reca/types';
import { DocumentRequirementsChecklist } from './DocumentRequirementsChecklist';
import { DocumentUploadZone } from '@/components/documents/DocumentUploadZone';
import { DocumentDashboard } from '@/components/documents/DocumentDashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FolderCheck,
} from 'lucide-react';

interface UploadedFile {
  id: string;
  fileKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  category?: string | null;
  status: string;
  customerStatus?: string;
  thumbnailKey?: string | null;
  uploadedAt: Date | string;
  isRequired: boolean;
  requiresOriginal: boolean;
  rejectionReason?: string | null;
  categoryLocked: boolean;
  ocrConfidence?: number | null;
  userConfirmed: boolean;
  validation?: {
    status: string;
    category?: string | null;
    confidence?: number | null;
  } | null;
}

interface RECADocumentDashboardProps {
  sessionId: string;
  intakeSessionId: string;
  formData: Partial<RECAFormData>;
  uploadedFiles: UploadedFile[];
  completionPercentage: number;
}

export function RECADocumentDashboard({
  sessionId,
  intakeSessionId,
  formData,
  uploadedFiles,
  completionPercentage,
}: RECADocumentDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requirements' | 'uploads'>('requirements');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Analyze document requirements based on form data
  const analysis = useMemo(() => {
    // Create a map of uploaded files by their category/purpose
    const uploadedMap: Record<string, boolean> = {};
    uploadedFiles.forEach(file => {
      if (file.category) {
        uploadedMap[file.category] = true;
      }
    });

    return analyzeDocumentRequirements(formData, uploadedMap);
  }, [formData, uploadedFiles]);

  // Calculate document completion statistics
  const stats = useMemo(() => {
    const totalRequired = analysis.requiredCount;
    const uploaded = uploadedFiles.length;
    const uploadedRequired = analysis.uploadedCount;
    const missingRequired = analysis.missingRequired.length;
    const validated = uploadedFiles.filter(f =>
      f.validation?.status === 'VERIFIED' || f.customerStatus === 'APPROVED'
    ).length;

    return {
      totalRequired,
      uploaded,
      uploadedRequired,
      missingRequired,
      validated,
      uploadPercentage: totalRequired > 0
        ? Math.round((uploadedRequired / totalRequired) * 100)
        : 0,
      validationPercentage: uploaded > 0
        ? Math.round((validated / uploaded) * 100)
        : 0,
    };
  }, [analysis, uploadedFiles]);

  const handleUpload = useCallback((requirementId: string) => {
    setUploadingFor(requirementId);
    setActiveTab('uploads');
  }, []);

  const handleContinue = () => {
    router.push(`/reca/review/${sessionId}`);
  };

  const handleBack = () => {
    // Navigate back to the last form section
    router.push(`/reca/form/${sessionId}`);
  };

  return (
    <div className="container mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900 mb-2">
            Document Requirements
          </h1>
          <p className="text-sage-600">
            Upload and manage documents required for your RECA claim
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {completionPercentage}% Complete
        </Badge>
      </div>

      {/* Overall Progress Card */}
      <Card className="border-2 border-sage-200 bg-gradient-to-br from-sage-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <FolderCheck className="h-5 w-5 text-terracotta-500" />
            Document Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Upload Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-sage-900">
                Document Upload Progress
              </span>
              <span className="text-sage-600">
                {stats.uploadedRequired} of {stats.totalRequired} required documents
              </span>
            </div>
            <Progress value={stats.uploadPercentage} className="h-3" />
          </div>

          {/* Validation Progress */}
          {stats.uploaded > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-sage-900">
                  Validation Progress
                </span>
                <span className="text-sage-600">
                  {stats.validated} of {stats.uploaded} documents validated
                </span>
              </div>
              <Progress value={stats.validationPercentage} className="h-3" />
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-sage-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-900">
                {stats.totalRequired}
              </div>
              <div className="text-xs text-sage-600">Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.uploadedRequired}
              </div>
              <div className="text-xs text-green-600">Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">
                {stats.missingRequired}
              </div>
              <div className="text-xs text-red-600">Missing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {stats.validated}
              </div>
              <div className="text-xs text-blue-600">Validated</div>
            </div>
          </div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-sage-200">
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
        </CardContent>
      </Card>

      {/* Tabs: Requirements vs Uploaded Documents */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requirements" className="gap-2">
            <FileText className="h-4 w-4" />
            Requirements
            {stats.missingRequired > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.missingRequired}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="uploads" className="gap-2">
            <Upload className="h-4 w-4" />
            Uploaded
            <Badge variant="outline" className="ml-1">
              {stats.uploaded}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6 mt-6">
          <DocumentRequirementsChecklist
            formData={formData}
            uploadedFiles={uploadedFiles.reduce((acc, file) => {
              if (file.category) {
                acc[file.category] = true;
              }
              return acc;
            }, {} as Record<string, boolean>)}
            onUpload={handleUpload}
            showCategories={true}
          />
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads" className="space-y-6 mt-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sage-900">
                <Upload className="h-5 w-5 text-terracotta-500" />
                Upload Documents
              </CardTitle>
              <CardDescription>
                {uploadingFor
                  ? `Upload documents for: ${analysis.requirements.find(r => r.id === uploadingFor)?.title || 'selected requirement'}`
                  : 'Upload any required documents for your claim'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadZone
                sessionId={intakeSessionId}
                onUploadComplete={() => {
                  // Refresh the page to show new uploads
                  router.refresh();
                }}
              />
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sage-900">
                Uploaded Documents
              </CardTitle>
              <CardDescription>
                Review, manage, and validate your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentDashboard
                sessionId={intakeSessionId}
                onRefresh={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-sage-200">
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2 rounded-full border-sage-300 text-sage-700 hover:bg-sage-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Forms
        </Button>

        {stats.missingRequired === 0 ? (
          <Button
            onClick={handleContinue}
            className="gap-2 rounded-full bg-terracotta-500 hover:bg-terracotta-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-sage-600">
              {stats.missingRequired} required document{stats.missingRequired !== 1 ? 's' : ''} remaining
            </span>
            <Button
              onClick={handleContinue}
              variant="outline"
              className="gap-2 rounded-full"
            >
              Continue Anyway
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
