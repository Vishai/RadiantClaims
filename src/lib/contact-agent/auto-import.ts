/**
 * Auto-import web search results to database
 * Makes the system self-improving - less web searches over time
 */

import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";
import type { ContactFromWeb } from "./web-search";

interface ImportOptions {
  minConfidenceScore?: number; // Only import high-quality results
  requirePhone?: boolean; // Must have phone number
  requireWebsite?: boolean; // Must have website
  autoVerify?: boolean; // Mark as AI-verified vs human-verified
}

/**
 * Score a web contact for quality (0-100)
 */
export function scoreWebContact(contact: ContactFromWeb): number {
  let score = 0;

  // Has phone? +30 points
  if (contact.phone) score += 30;

  // Has email? +20 points
  if (contact.email) score += 20;

  // Has physical address? +25 points
  if (contact.address) score += 25;

  // Is .gov domain? +20 points
  if (contact.website?.includes(".gov")) score += 20;
  else if (contact.website?.includes(".us")) score += 15;
  else if (contact.website) score += 5;

  // Has multiple contact methods? Bonus
  const contactMethods = [contact.phone, contact.email, contact.website].filter(
    Boolean
  ).length;
  if (contactMethods >= 2) score += 10;

  return score;
}

/**
 * Check if a contact should be auto-imported
 */
export function shouldAutoImport(
  contact: ContactFromWeb,
  options: ImportOptions = {}
): { should: boolean; reason: string } {
  const {
    minConfidenceScore = 70,
    requirePhone = false,
    requireWebsite = false,
  } = options;

  const score = scoreWebContact(contact);

  if (score < minConfidenceScore) {
    return {
      should: false,
      reason: `Low confidence score: ${score} < ${minConfidenceScore}`,
    };
  }

  if (requirePhone && !contact.phone) {
    return { should: false, reason: "Missing required phone number" };
  }

  if (requireWebsite && !contact.website) {
    return { should: false, reason: "Missing required website" };
  }

  if (!contact.name || !contact.state) {
    return { should: false, reason: "Missing required fields (name or state)" };
  }

  return { should: true, reason: `Good quality (score: ${score})` };
}

/**
 * Auto-import a web contact to the database
 */
export async function autoImportWebContact(
  contact: ContactFromWeb,
  options: ImportOptions = {}
): Promise<{
  success: boolean;
  action: "created" | "updated" | "skipped";
  reason: string;
  contactId?: string;
}> {
  try {
    // Check if should import
    const { should, reason } = shouldAutoImport(contact, options);
    if (!should) {
      return { success: false, action: "skipped", reason };
    }

    // Parse address
    const addressParts = parseAddress(contact.address || "");

    // Map resource type
    const resourceType = mapResourceType(contact.type);

    // Build notes
    const notes = [
      contact.notes,
      `Auto-imported from web search (${contact.source})`,
      `Confidence score: ${scoreWebContact(contact)}/100`,
      `Source URL: ${contact.sourceUrl}`,
      options.autoVerify ? "⚠️ AI-verified only - needs human review" : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Check if already exists
    const existing = await prisma.documentResource.findFirst({
      where: {
        name: contact.name,
        state: contact.state ? contact.state.toUpperCase() : "UNKNOWN",
        county: contact.county
          ? { equals: contact.county, mode: "insensitive" as const }
          : undefined,
      },
    });

    const data = {
      state: contact.state ? contact.state.toUpperCase() : "UNKNOWN",
      county: contact.county || null,
      resourceType,
      name: contact.name,
      department: null,
      address: addressParts.address || contact.address || null,
      address2: null,
      city: addressParts.city || contact.city || null,
      stateCode: contact.state ? contact.state.toUpperCase() : "UNKNOWN",
      zipCode: addressParts.zipCode || null,
      phone: contact.phone || null,
      phoneTollFree: null,
      fax: null,
      website: contact.website || null,
      email: contact.email || null,
      notes,
      documentTypesProvided: [], // Will be enriched later
      certificationAvailable: true,
      processingTimeDays: null,
      specialInstructions: options.autoVerify
        ? "This contact was automatically imported from web search. Please verify information before relying on it."
        : null,
      isTribal: false,
      tribalAffiliation: null,
      purposeDescription: null,
      whatToBring: [],
      appointmentRequired: false,
      acceptsMailRequests: true,
      acceptsOnlineRequests: contact.website ? true : false,
      estimatedCost: null,
    };

    if (existing) {
      // Update only if new data is better quality
      const existingScore = existing.phone ? 50 : 0; // Simple heuristic
      const newScore = scoreWebContact(contact);

      if (newScore > existingScore) {
        await prisma.documentResource.update({
          where: { id: existing.id },
          data,
        });
        return {
          success: true,
          action: "updated",
          reason: `Updated with better data (score: ${newScore})`,
          contactId: existing.id,
        };
      } else {
        return {
          success: false,
          action: "skipped",
          reason: "Existing data is better quality",
        };
      }
    } else {
      // Create new
      const created = await prisma.documentResource.create({ data });
      return {
        success: true,
        action: "created",
        reason: `Created new contact (score: ${scoreWebContact(contact)})`,
        contactId: created.id,
      };
    }
  } catch (error) {
    return {
      success: false,
      action: "skipped",
      reason: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Batch import multiple web contacts
 */
export async function batchAutoImport(
  contacts: ContactFromWeb[],
  options: ImportOptions = {}
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const contact of contacts) {
    const result = await autoImportWebContact(contact, options);

    if (result.success) {
      if (result.action === "created") results.created++;
      else if (result.action === "updated") results.updated++;
    } else {
      results.skipped++;
      if (result.reason.includes("Error")) {
        results.errors.push(`${contact.name}: ${result.reason}`);
      }
    }
  }

  return results;
}

/**
 * Helper to parse address string
 */
function parseAddress(addressStr: string) {
  if (!addressStr) return { address: null, city: null, zipCode: null };

  // Extract zip code
  const zipMatch = addressStr.match(/\b(\d{5}(-\d{4})?)\b/);
  const zipCode = zipMatch ? zipMatch[1] : null;

  // Try to extract city (word before state code and zip)
  const cityMatch = addressStr.match(/,\s*([A-Za-z\s]+),?\s*[A-Z]{2}\s*\d{5}/);
  const city = cityMatch && cityMatch[1] ? cityMatch[1].trim() : null;

  // Address is everything before city
  let address = addressStr;
  if (city) {
    address = city
      ? (addressStr.split(city)[0] || "").replace(/,$/, "").trim()
      : addressStr;
  }

  return { address: address || null, city, zipCode };
}

/**
 * Map web contact type to Prisma ResourceType
 */
function mapResourceType(type: string): ResourceType {
  const typeMap: Record<string, ResourceType> = {
    VITAL_RECORDS: "VITAL_RECORDS",
    COUNTY_CLERK: "COUNTY_CLERK",
    COUNTY_RECORDER: "COUNTY_RECORDER",
    HOSPITAL: "HOSPITAL",
    CANCER_REGISTRY: "CANCER_REGISTRY",
    SCHOOL_DISTRICT: "SCHOOL_DISTRICT",
    CHURCH: "CHURCH",
    TRIBAL_OFFICE: "TRIBAL_OFFICE",
  };

  return typeMap[type] || "VITAL_RECORDS"; // Default fallback
}

/**
 * Get import statistics
 */
export async function getAutoImportStats() {
  const total = await prisma.documentResource.count();

  const autoImported = await prisma.documentResource.count({
    where: {
      notes: {
        contains: "Auto-imported from web search",
      },
    },
  });

  const needsReview = await prisma.documentResource.count({
    where: {
      notes: {
        contains: "AI-verified only - needs human review",
      },
    },
  });

  return {
    total,
    autoImported,
    needsReview,
    percentAutoImported: total > 0 ? (autoImported / total) * 100 : 0,
  };
}
