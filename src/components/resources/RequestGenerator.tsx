"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileText, Download, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HospitalSearchInput } from "@/components/ui/hospital-search-input";

interface RequestGeneratorProps {
  defaultHospitalName?: string;
  defaultPatientName?: string;
  onCancel?: () => void;
}

export function RequestGenerator({
  defaultHospitalName = "",
  defaultPatientName = "",
  onCancel,
}: RequestGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistryAlert, setShowRegistryAlert] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: defaultHospitalName,
    patientName: defaultPatientName,
    patientDOB: "",
    patientSSN: "",
    diagnosisYear: "",
    requesterName: defaultPatientName, // Default to self-request
    requesterAddress: "",
    requesterCity: "",
    requesterState: "",
    requesterZip: "",
    requesterPhone: "",
    relationship: "Self",
    treatmentDates: "1950-1970",
  });

  useEffect(() => {
    const year = parseInt(formData.diagnosisYear);
    if (year && year < 2000) {
      setShowRegistryAlert(true);
    } else {
      setShowRegistryAlert(false);
    }
  }, [formData.diagnosisYear]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchToRegistry = () => {
    setFormData((prev) => ({
      ...prev,
      hospitalName: "State Cancer Registry",
      treatmentDates: prev.diagnosisYear || prev.treatmentDates,
    }));
    toast({
      title: "Switched to Registry Request",
      description:
        "Please ensure you find the correct mailing address for your State Cancer Registry.",
    });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/resources/generate-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to generate packet");

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Records_Request_${formData.hospitalName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Packet Generated",
        description: "Your medical records request packet is ready.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not generate packet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-terracotta-600" />
          Medical Records Request Generator
        </CardTitle>
        <CardDescription>
          Create a professional request packet (Cover Letter + HIPAA Release +
          ID) to send to hospitals or cancer registries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="diagnosisYear">Diagnosis Year</Label>
            <Input
              id="diagnosisYear"
              name="diagnosisYear"
              type="number"
              value={formData.diagnosisYear}
              onChange={handleInputChange}
              placeholder="e.g. 1998"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatmentDates">Treatment Dates (Approx.)</Label>
            <Input
              id="treatmentDates"
              name="treatmentDates"
              value={formData.treatmentDates}
              onChange={handleInputChange}
              placeholder="e.g. 1950-1965"
            />
          </div>
        </div>

        {showRegistryAlert && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle>Historical Records Warning</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2 text-sm">
                Hospitals are generally not required to keep medical records for
                more than 20-25 years (state laws vary, but 7-10 years is the
                federal minimum). For a diagnosis in {formData.diagnosisYear},
                the hospital likely no longer has these records.
              </p>
              <p className="mb-3 text-sm">
                We recommend contacting the{" "}
                <strong>State Cancer Registry</strong>, as they maintain
                permanent records of cancer diagnoses.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchToRegistry}
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
              >
                Switch to Cancer Registry Request
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <strong>Includes Pathology Request:</strong> This tool
              automatically generates a request for your
              <strong>Pathology Report</strong> and other critical documents.
              You do not need to create a separate request for pathology.
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Replaced standard Input with HospitalSearchInput */}
          <HospitalSearchInput
            label="Hospital / Facility Name"
            value={formData.hospitalName}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, hospitalName: val }))
            }
            placeholder="e.g. St. George Regional Hospital"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-sage-900">
            Patient Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientDOB">Date of Birth</Label>
              <Input
                id="patientDOB"
                name="patientDOB"
                type="date"
                value={formData.patientDOB}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientSSN">SSN (Last 4 or Full)</Label>
              <Input
                id="patientSSN"
                name="patientSSN"
                value={formData.patientSSN}
                onChange={handleInputChange}
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-sage-900">
            Your Contact Info (Where records will be sent)
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requesterName">Your Name</Label>
              <Input
                id="requesterName"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterPhone">Phone Number</Label>
              <Input
                id="requesterPhone"
                name="requesterPhone"
                value={formData.requesterPhone}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="requesterAddress">Mailing Address</Label>
              <Input
                id="requesterAddress"
                name="requesterAddress"
                value={formData.requesterAddress}
                onChange={handleInputChange}
                placeholder="Street Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterCity">City</Label>
              <Input
                id="requesterCity"
                name="requesterCity"
                value={formData.requesterCity}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="requesterState">State</Label>
                <Input
                  id="requesterState"
                  name="requesterState"
                  value={formData.requesterState}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requesterZip">Zip</Label>
                <Input
                  id="requesterZip"
                  name="requesterZip"
                  value={formData.requesterZip}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-terracotta-600 hover:bg-terracotta-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Request Packet
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
