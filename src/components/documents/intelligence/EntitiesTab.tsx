"use client";

import { IntelligenceResponse } from "@/app/api/documents/[id]/intelligence/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Calendar,
  MapPin,
  Heart,
  Briefcase,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface EntitiesTabProps {
  data: IntelligenceResponse;
}

export function EntitiesTab({ data }: EntitiesTabProps) {
  const { entities } = data;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      onClick={() => copyToClipboard(text, id)}
    >
      {copiedField === id ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6 py-4">
      {/* Persons */}
      {entities.persons.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5" />
            Persons ({entities.persons.length})
          </h3>
          <div className="space-y-3">
            {entities.persons.map((person, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{person.name}</p>
                    <Badge variant="outline" className="capitalize">
                      {person.role.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Math.round(person.confidence * 100)}% confidence •
                    Mentioned on {person.mentions.length} page(s)
                  </div>
                </div>
                <CopyButton text={person.name} id={`person-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      {entities.dates.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            Important Dates ({entities.dates.length})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Page</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.dates.map((date, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium capitalize">
                    {date.label.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>{date.value}</TableCell>
                  <TableCell>{Math.round(date.confidence * 100)}%</TableCell>
                  <TableCell>{date.page}</TableCell>
                  <TableCell>
                    <CopyButton text={date.value} id={`date-${idx}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Addresses */}
      {entities.addresses.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            Addresses ({entities.addresses.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {entities.addresses.map((address, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="outline" className="capitalize">
                    {address.label.replace("_", " ")}
                  </Badge>
                  <CopyButton
                    text={address.full_address}
                    id={`address-${idx}`}
                  />
                </div>
                <p className="text-sm font-medium">{address.full_address}</p>
                {address.county && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {address.county}, {address.state}
                  </p>
                )}
                {address.years && (
                  <p className="text-xs text-muted-foreground">
                    Years: {address.years}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round(address.confidence * 100)}% confidence • Page{" "}
                  {address.page}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Records */}
      {entities.medical.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Heart className="h-5 w-5" />
            Medical Records ({entities.medical.length})
          </h3>
          <div className="space-y-4">
            {entities.medical.map((medical, idx) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-start justify-between">
                  {medical.diagnosis && (
                    <div className="flex-1">
                      <p className="font-medium">{medical.diagnosis}</p>
                      {medical.icd_code && (
                        <Badge variant="outline" className="mt-1">
                          {medical.icd_code}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CopyButton
                    text={medical.diagnosis || "No diagnosis"}
                    id={`medical-${idx}`}
                  />
                </div>
                <div className="mt-2 grid gap-2 text-sm">
                  {medical.facility && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Facility:</span>{" "}
                      {medical.facility}
                    </p>
                  )}
                  {medical.doctor && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Doctor:</span>{" "}
                      {medical.doctor}
                    </p>
                  )}
                  {medical.diagnosis_date && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Diagnosed:</span>{" "}
                      {medical.diagnosis_date}
                    </p>
                  )}
                  {medical.notes && (
                    <p className="text-muted-foreground">
                      <span className="font-medium">Notes:</span>{" "}
                      {medical.notes}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {Math.round(medical.confidence * 100)}% confidence • Page{" "}
                  {medical.page}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employment */}
      {entities.employment.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Briefcase className="h-5 w-5" />
            Employment History ({entities.employment.length})
          </h3>
          <div className="space-y-3">
            {entities.employment.map((emp, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{emp.employer}</p>
                    {emp.nuclear_facility && (
                      <Badge variant="destructive">Nuclear Facility</Badge>
                    )}
                  </div>
                  {emp.job_title && (
                    <p className="text-sm text-muted-foreground">
                      {emp.job_title}
                    </p>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {emp.start_date && emp.end_date && (
                      <span>
                        {emp.start_date} to {emp.end_date}
                      </span>
                    )}
                    {emp.location && <span> • {emp.location}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(emp.confidence * 100)}% confidence • Page{" "}
                    {emp.page}
                  </p>
                </div>
                <CopyButton text={emp.employer} id={`emp-${idx}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No entities found */}
      {entities.persons.length === 0 &&
        entities.dates.length === 0 &&
        entities.addresses.length === 0 &&
        entities.medical.length === 0 &&
        entities.employment.length === 0 && (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No entities extracted from this document yet.
          </div>
        )}
    </div>
  );
}
