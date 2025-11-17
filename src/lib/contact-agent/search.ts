import { prisma } from "@/lib/prisma";
import { ResourceType } from "@prisma/client";

export interface ContactSearchParams {
  state?: string;
  county?: string;
  resourceTypes?: ResourceType[];
  documentTypes?: string[];
  searchQuery?: string;
}

export interface ContactSearchResult {
  id: string;
  name: string;
  resourceType: ResourceType;
  state: string;
  county: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  documentTypesProvided: string[];
  notes: string | null;
  estimatedCost: number | null;
  processingTimeDays: number | null;
  acceptsMailRequests: boolean;
  acceptsOnlineRequests: boolean;
  appointmentRequired: boolean;
  stats?: {
    totalFeedback: number;
    successCount: number;
    contactedCount: number;
    successRate: number | null;
    avgRating: number | null;
  };
}

/**
 * Search for institutional contacts in the database
 */
export async function searchContacts(
  params: ContactSearchParams
): Promise<ContactSearchResult[]> {
  const where: any = {};

  // State filter
  if (params.state) {
    where.state = params.state.toUpperCase();
  }

  // County filter (case insensitive)
  if (params.county) {
    where.county = {
      equals: params.county,
      mode: "insensitive" as const,
    };
  }

  // Resource type filter
  if (params.resourceTypes && params.resourceTypes.length > 0) {
    where.resourceType = {
      in: params.resourceTypes,
    };
  }

  // Document type filter
  if (params.documentTypes && params.documentTypes.length > 0) {
    where.documentTypesProvided = {
      hasSome: params.documentTypes,
    };
  }

  // Text search across name, department, notes
  if (params.searchQuery) {
    where.OR = [
      {
        name: {
          contains: params.searchQuery,
          mode: "insensitive" as const,
        },
      },
      {
        department: {
          contains: params.searchQuery,
          mode: "insensitive" as const,
        },
      },
      {
        notes: {
          contains: params.searchQuery,
          mode: "insensitive" as const,
        },
      },
    ];
  }

  const resources = await prisma.documentResource.findMany({
    where,
    select: {
      id: true,
      name: true,
      resourceType: true,
      state: true,
      county: true,
      phone: true,
      email: true,
      website: true,
      address: true,
      city: true,
      zipCode: true,
      documentTypesProvided: true,
      notes: true,
      estimatedCost: true,
      processingTimeDays: true,
      acceptsMailRequests: true,
      acceptsOnlineRequests: true,
      appointmentRequired: true,
    },
    // We'll sort manually after attaching stats
    take: 100, // Get more results since we'll filter and sort by rating
  });

  // Fetch stats for resources and attach them
  const resourceIds = resources.map((r) => r.id);
  const stats = await prisma.resourceStats.findMany({
    where: {
      resourceId: { in: resourceIds },
    },
    select: {
      resourceId: true,
      totalFeedback: true,
      successCount: true,
      contactedCount: true,
      successRate: true,
      avgRating: true,
    },
  });

  // Create a map for quick lookup
  const statsMap = new Map(stats.map((s) => [s.resourceId, s]));

  // Attach stats to resources
  const resourcesWithStats = resources.map((resource) => {
    const resourceStats = statsMap.get(resource.id);
    return {
      ...resource,
      stats: resourceStats
        ? {
            totalFeedback: resourceStats.totalFeedback,
            successCount: resourceStats.successCount,
            contactedCount: resourceStats.contactedCount,
            successRate: resourceStats.successRate,
            avgRating: resourceStats.avgRating,
          }
        : undefined,
    };
  });

  // Sort by best quality first
  // Priority:
  // 1. Resources with stats (rated resources first)
  // 2. High success rate (>=80%)
  // 3. High avg rating (>=4.0)
  // 4. Number of feedbacks (more is better)
  // 5. County-specific over state-wide
  // 6. Name alphabetically
  resourcesWithStats.sort((a, b) => {
    const aHasStats = a.stats && a.stats.totalFeedback >= 3;
    const bHasStats = b.stats && b.stats.totalFeedback >= 3;

    // Resources with sufficient stats come first
    if (aHasStats && !bHasStats) return -1;
    if (!aHasStats && bHasStats) return 1;

    // Both have stats - compare quality
    if (aHasStats && bHasStats) {
      // Sort by success rate (higher is better)
      const aSuccess = a.stats!.successRate || 0;
      const bSuccess = b.stats!.successRate || 0;
      if (aSuccess !== bSuccess) {
        return bSuccess - aSuccess; // Descending
      }

      // If success rates are equal, sort by avg rating
      const aRating = a.stats!.avgRating || 0;
      const bRating = b.stats!.avgRating || 0;
      if (aRating !== bRating) {
        return bRating - aRating; // Descending
      }

      // If ratings are equal, sort by number of feedbacks
      const aFeedback = a.stats!.totalFeedback;
      const bFeedback = b.stats!.totalFeedback;
      if (aFeedback !== bFeedback) {
        return bFeedback - aFeedback; // Descending
      }
    }

    // County-specific resources before state-wide
    if (a.county && !b.county) return -1;
    if (!a.county && b.county) return 1;

    // Finally, alphabetically by name
    return a.name.localeCompare(b.name);
  });

  // Return top 20 results
  return resourcesWithStats.slice(0, 20);
}

/**
 * Get a single contact by ID
 */
export async function getContactById(id: string) {
  return prisma.documentResource.findUnique({
    where: { id },
  });
}

/**
 * Suggest contacts based on natural language query
 * This is used by the AI agent to intelligently search
 */
export async function suggestContacts(
  userMessage: string,
  context?: {
    claimType?: string;
    state?: string;
    county?: string;
  }
): Promise<ContactSearchResult[]> {
  // Extract intent from message
  const message = userMessage.toLowerCase();

  // Determine what document they need
  const documentTypes: string[] = [];
  if (message.includes("birth certificate") || message.includes("birth cert")) {
    documentTypes.push("BIRTH_CERTIFICATE");
  }
  if (message.includes("death certificate") || message.includes("death cert")) {
    documentTypes.push("DEATH_CERTIFICATE");
  }
  if (message.includes("medical") || message.includes("hospital")) {
    documentTypes.push("MEDICAL_RECORDS");
  }
  if (message.includes("school") || message.includes("transcript")) {
    documentTypes.push("SCHOOL_RECORDS");
  }

  // Determine resource type
  const resourceTypes: ResourceType[] = [];
  if (message.includes("hospital")) {
    resourceTypes.push("HOSPITAL");
  }
  if (
    message.includes("vital records") ||
    message.includes("birth") ||
    message.includes("death")
  ) {
    resourceTypes.push("VITAL_RECORDS");
  }
  if (message.includes("school") || message.includes("education")) {
    resourceTypes.push("SCHOOL_DISTRICT");
  }
  if (message.includes("county")) {
    resourceTypes.push("COUNTY_CLERK", "COUNTY_RECORDER");
  }

  // Build search params
  const searchParams: ContactSearchParams = {
    state: context?.state,
    county: context?.county,
    documentTypes: documentTypes.length > 0 ? documentTypes : undefined,
    resourceTypes: resourceTypes.length > 0 ? resourceTypes : undefined,
  };

  return searchContacts(searchParams);
}
