import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Clock,
  DollarSign,
  ExternalLink,
  Copy,
  Check,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState } from "react";

interface DocumentResource {
  id: string;
  state: string;
  county: string | null;
  resourceType: string;
  name: string;
  department: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  phone: string | null;
  phoneTollFree: string | null;
  fax: string | null;
  website: string | null;
  email: string | null;
  notes: string | null;
  documentTypesProvided: string[];
  certificationAvailable: boolean;
  processingTimeDays: number | null;
  specialInstructions: string | null;
  isTribal: boolean;
  tribalAffiliation: string | null;
  // New fields
  purposeDescription: string | null;
  whatToBring: string[];
  appointmentRequired: boolean;
  acceptsMailRequests: boolean;
  acceptsOnlineRequests: boolean;
  estimatedCost: number | null;
}

interface ResourceCardProps {
  resource: DocumentResource;
  compact?: boolean;
}

export function ResourceCard({ resource, compact = false }: ResourceCardProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const fullAddress = [
    resource.address,
    resource.address2,
    resource.city && resource.stateCode && resource.zipCode
      ? `${resource.city}, ${resource.stateCode} ${resource.zipCode}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(fullAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyPhone = async (phone: string) => {
    await navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const formatResourceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Card className="rounded-2xl border-sage-200 transition-colors hover:border-sage-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg text-sage-900">
              {resource.name}
            </CardTitle>
            {resource.department && (
              <CardDescription className="mt-1 text-sm text-sage-600">
                {resource.department}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="border-sage-300 text-sage-700">
              {formatResourceType(resource.resourceType)}
            </Badge>
            {resource.isTribal && (
              <Badge
                variant="outline"
                className="border-terracotta-300 text-terracotta-700"
              >
                Tribal Office
              </Badge>
            )}
            {resource.county ? (
              <Badge
                variant="outline"
                className="border-blue-300 text-xs text-blue-700"
              >
                {resource.county} County
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-purple-300 text-xs text-purple-700"
              >
                State-Wide
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address */}
        {fullAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
            <div className="flex-1">
              <p className="whitespace-pre-line text-sm text-sage-700">
                {fullAddress}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="mt-1 h-7 text-xs"
              >
                {copiedAddress ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy Address
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Phone Numbers */}
        <div className="space-y-2">
          {resource.phoneTollFree && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 flex-shrink-0 text-sage-600" />
              <div className="flex flex-1 items-center gap-2">
                <a
                  href={`tel:${resource.phoneTollFree}`}
                  className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700 hover:underline"
                >
                  {resource.phoneTollFree}
                </a>
                <Badge variant="outline" className="text-xs">
                  Toll-Free
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPhone(resource.phoneTollFree!)}
                  className="h-6 px-2"
                >
                  {copiedPhone ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
          {resource.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 flex-shrink-0 text-sage-600" />
              <div className="flex flex-1 items-center gap-2">
                <a
                  href={`tel:${resource.phone}`}
                  className="text-sm text-terracotta-600 hover:text-terracotta-700 hover:underline"
                >
                  {resource.phone}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPhone(resource.phone!)}
                  className="h-6 px-2"
                >
                  {copiedPhone ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Website */}
        {resource.website && (
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 flex-shrink-0 text-sage-600" />
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-terracotta-600 hover:text-terracotta-700 hover:underline"
            >
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Email */}
        {resource.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 flex-shrink-0 text-sage-600" />
            <a
              href={`mailto:${resource.email}`}
              className="text-sm text-terracotta-600 hover:text-terracotta-700 hover:underline"
            >
              {resource.email}
            </a>
          </div>
        )}

        {/* Processing Time */}
        {resource.processingTimeDays && (
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 flex-shrink-0 text-sage-600" />
            <p className="text-sm text-sage-700">
              Processing time: {resource.processingTimeDays} days
              {resource.processingTimeDays > 30 && " (allow extra time)"}
            </p>
          </div>
        )}

        {/* Estimated Cost */}
        {resource.estimatedCost !== null &&
          resource.estimatedCost !== undefined && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 flex-shrink-0 text-sage-600" />
              <p className="text-sm text-sage-700">
                Estimated cost: ${resource.estimatedCost.toFixed(2)} per
                document
              </p>
            </div>
          )}

        {/* Request Methods */}
        <div className="flex flex-wrap items-center gap-2">
          {resource.acceptsOnlineRequests && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-xs text-emerald-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Online Requests
            </Badge>
          )}
          {resource.acceptsMailRequests && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-xs text-blue-700"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Mail Requests
            </Badge>
          )}
          {resource.appointmentRequired && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-xs text-amber-700"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Appointment Required
            </Badge>
          )}
        </div>

        {/* Purpose Description */}
        {resource.purposeDescription && !compact && (
          <div className="-mx-6 rounded-lg border-t border-terracotta-200 bg-terracotta-50/30 px-6 py-4 pt-3">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-600" />
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-terracotta-700">
                  Why Contact This Office
                </p>
                <p className="text-sm leading-relaxed text-terracotta-800">
                  {resource.purposeDescription}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What to Bring */}
        {resource.whatToBring &&
          resource.whatToBring.length > 0 &&
          !compact && (
            <div className="-mx-6 rounded-lg border-t border-sage-200 bg-sage-50/50 px-6 py-4 pt-3">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-600" />
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sage-700">
                    What to Bring{" "}
                    {resource.appointmentRequired && "(In-Person Visit)"}
                  </p>
                  <ul className="space-y-1.5">
                    {resource.whatToBring.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-sage-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        {/* Documents Provided */}
        {resource.documentTypesProvided.length > 0 && !compact && (
          <div className="border-t border-sage-200 pt-3">
            <p className="mb-2 text-xs font-semibold text-sage-700">
              Documents Available:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {resource.documentTypesProvided.map((docType) => (
                <Badge
                  key={docType}
                  variant="secondary"
                  className="bg-sage-100 text-xs text-sage-700 hover:bg-sage-200"
                >
                  {docType.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {resource.specialInstructions && !compact && (
          <div className="border-t border-sage-200 pt-3">
            <p className="mb-1 text-xs font-semibold text-sage-700">
              Special Instructions:
            </p>
            <p className="text-sm text-sage-600">
              {resource.specialInstructions}
            </p>
          </div>
        )}

        {/* Notes */}
        {resource.notes && !compact && (
          <div className="border-t border-sage-200 pt-3">
            <p className="mb-1 text-xs font-semibold text-sage-700">Notes:</p>
            <p className="text-sm text-sage-600">{resource.notes}</p>
          </div>
        )}

        {/* Tribal Affiliation */}
        {resource.tribalAffiliation && (
          <div className="border-t border-terracotta-200 pt-3">
            <p className="mb-1 text-xs font-semibold text-terracotta-700">
              Tribal Nation:
            </p>
            <p className="text-sm text-terracotta-600">
              {resource.tribalAffiliation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
