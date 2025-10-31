"use client";

import { useState, useEffect } from "react";
import { ResourceCard } from "./ResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, FileText, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResourceFinderProps {
  state?: string;
  county?: string;
  documentType?: string;
  resourceType?: string;
  compact?: boolean;
  autoSearch?: boolean; // Automatically search on mount
}

const US_STATES = [
  { code: "UT", name: "Utah" },
  { code: "NV", name: "Nevada" },
  { code: "AZ", name: "Arizona" },
  { code: "ID", name: "Idaho" },
  { code: "NM", name: "New Mexico" },
];

const RESOURCE_TYPES = [
  { value: "VITAL_RECORDS", label: "Vital Records Office" },
  { value: "COUNTY_CLERK", label: "County Clerk" },
  { value: "HOSPITAL", label: "Hospital / Medical Center" },
  { value: "CANCER_REGISTRY", label: "Cancer Registry" },
  { value: "COUNTY_RECORDER", label: "County Recorder" },
  { value: "SCHOOL_DISTRICT", label: "School District" },
  { value: "TRIBAL_OFFICE", label: "Tribal Office" },
  { value: "STATE_ARCHIVES", label: "State Archives" },
];

const DOCUMENT_TYPES = [
  { value: "BIRTH_CERTIFICATE", label: "Birth Certificate" },
  { value: "DEATH_CERTIFICATE", label: "Death Certificate" },
  { value: "MARRIAGE_CERTIFICATE", label: "Marriage Certificate" },
  { value: "MEDICAL_RECORDS", label: "Medical Records" },
  { value: "PATHOLOGY_REPORT", label: "Pathology Report" },
  { value: "SCHOOL_RECORDS", label: "School Records" },
  { value: "PROPERTY_RECORDS", label: "Property Records" },
  { value: "TAX_RECORDS", label: "Tax Records" },
];

export function ResourceFinder({
  state: initialState,
  county: initialCounty,
  documentType: initialDocumentType,
  resourceType: initialResourceType,
  compact = false,
  autoSearch = false,
}: ResourceFinderProps) {
  const [state, setState] = useState(initialState || "");
  const [county, setCounty] = useState(initialCounty || "");
  const [documentType, setDocumentType] = useState(initialDocumentType || "");
  const [resourceType, setResourceType] = useState(initialResourceType || "");

  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsMessage, setResultsMessage] = useState("");

  useEffect(() => {
    if (autoSearch && state) {
      handleSearch();
    }
  }, [autoSearch, state]);

  const handleSearch = async () => {
    if (!state && !resourceType && !documentType) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (state) params.append("state", state);
      if (county) params.append("county", county);
      if (resourceType) params.append("resourceType", resourceType);
      if (documentType) params.append("documentType", documentType);

      const response = await fetch(
        `/api/resources/search?${params.toString()}`
      );
      const data = await response.json();

      setResources(data.resources || []);
      setResultsMessage(data.message || "");
    } catch (error) {
      console.error("Error searching resources:", error);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setState(initialState || "");
    setCounty(initialCounty || "");
    setDocumentType(initialDocumentType || "");
    setResourceType(initialResourceType || "");
    setResources([]);
    setHasSearched(false);
    setResultsMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="rounded-2xl border-sage-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sage-900">
            <Search className="h-5 w-5" />
            Find Document Resources
          </CardTitle>
          <CardDescription className="text-sage-600">
            Search for government offices and resources to obtain documents for
            your RECA claim.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* State Selector */}
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sage-700">
                State *
              </Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger id="state" className="border-sage-300">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* County Input */}
            <div className="space-y-2">
              <Label htmlFor="county" className="text-sage-700">
                County (Optional)
              </Label>
              <Input
                id="county"
                placeholder="e.g., Washington"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="border-sage-300"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType" className="text-sage-700">
                Document Needed (Optional)
              </Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType" className="border-sage-300">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Document</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resource Type */}
            <div className="space-y-2">
              <Label htmlFor="resourceType" className="text-sage-700">
                Resource Type (Optional)
              </Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger id="resourceType" className="border-sage-300">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Type</SelectItem>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSearch}
              disabled={isLoading || !state}
              className="bg-terracotta-500 text-white hover:bg-terracotta-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Resources
                </>
              )}
            </Button>
            {hasSearched && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-sage-300"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-sage-900">
                {resources.length === 0
                  ? "No Resources Found"
                  : `${resources.length} Resource${resources.length !== 1 ? "s" : ""} Found`}
              </h3>
              {resultsMessage && (
                <p className="mt-1 text-sm text-sage-600">{resultsMessage}</p>
              )}
            </div>
          </div>

          {/* Resource Cards */}
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  compact={compact}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-sage-200">
              <CardContent className="py-12 text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-sage-400" />
                <p className="mb-2 font-medium text-sage-700">
                  No resources found
                </p>
                <p className="mx-auto max-w-md text-sm text-sage-600">
                  Try adjusting your search criteria. Remove county filter to
                  see state-wide resources, or change the document type.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State - Before Search */}
      {!hasSearched && !isLoading && (
        <Card className="rounded-2xl border-sage-200 bg-gradient-to-br from-sage-50 to-white">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-sage-400" />
            <p className="mb-2 font-medium text-sage-700">Ready to search</p>
            <p className="mx-auto max-w-md text-sm text-sage-600">
              Select a state and optionally refine your search with county,
              document type, or resource type. We'll help you find exactly where
              to get your documents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
