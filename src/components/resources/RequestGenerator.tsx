"use client";

import { useState } from "react";
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
import { Loader2, FileText, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
  const [formData, setFormData] = useState({
    hospitalName: defaultHospitalName,
    patientName: defaultPatientName,
    patientDOB: "",
    patientSSN: "",
    requesterName: defaultPatientName, // Default to self-request
    requesterAddress: "",
    requesterCity: "",
    requesterState: "",
    requesterZip: "",
    requesterPhone: "",
    relationship: "Self",
    treatmentDates: "1950-1970",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          ID) to send to hospitals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hospitalName">Hospital / Facility Name</Label>
            <Input
              id="hospitalName"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleInputChange}
              placeholder="e.g. St. George Regional Hospital"
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
