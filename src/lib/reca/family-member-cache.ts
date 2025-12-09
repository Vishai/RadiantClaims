/**
 * Family Member Data Cache
 *
 * Stores and retrieves family member information across multiple claims.
 * This allows users to file claims for multiple family members (e.g., both parents)
 * without re-entering the same information.
 *
 * Use Cases:
 * - Filing claim for deceased mother, then deceased father
 * - Siblings can reuse parent information across their own claims
 * - Spouse information reused when filing for multiple children
 */

import type { Part2ClaimantInfo, Part1FilerInfo } from "./types";

export interface FamilyMember {
  id: string;
  relationship: "parent" | "spouse" | "child" | "sibling" | "self";
  firstName: string;
  middleName?: string;
  lastName: string;
  formerNames?: string;
  ssn?: string;
  dob?: string;
  dod?: string; // Date of death (if applicable)
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  // Metadata
  savedAt: string;
  lastUsedAt?: string;
  claimIds?: string[]; // Claims this person is associated with
}

export interface FamilyMemberCache {
  userId: string;
  members: FamilyMember[];
  lastUpdated: string;
}

const STORAGE_KEY = "radiantclaims_family_cache";

/**
 * Get family member cache from localStorage
 */
export function getFamilyMemberCache(userId: string): FamilyMember[] {
  if (typeof window === "undefined") return [];

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return [];

    const cache: FamilyMemberCache = JSON.parse(cached);

    // Only return if it's for the current user
    if (cache.userId !== userId) return [];

    return cache.members || [];
  } catch (error) {
    console.error("Error reading family member cache:", error);
    return [];
  }
}

/**
 * Save family member to cache
 */
export function saveFamilyMember(
  userId: string,
  member: Omit<FamilyMember, "savedAt" | "lastUsedAt">
): void {
  if (typeof window === "undefined") return;

  try {
    const existingMembers = getFamilyMemberCache(userId);

    // Check if member already exists (by ID or by name+DOB match)
    const existingIndex = existingMembers.findIndex(
      (m) =>
        m.id === member.id ||
        (m.firstName === member.firstName &&
          m.lastName === member.lastName &&
          m.dob === member.dob)
    );

    const newMember: FamilyMember = {
      ...member,
      savedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };

    let updatedMembers: FamilyMember[];
    if (existingIndex >= 0) {
      // Update existing member
      updatedMembers = [...existingMembers];
      updatedMembers[existingIndex] = {
        ...updatedMembers[existingIndex],
        ...newMember,
        claimIds: [
          ...(updatedMembers[existingIndex].claimIds || []),
          ...(newMember.claimIds || []),
        ].filter((v, i, a) => a.indexOf(v) === i), // Unique claim IDs
      };
    } else {
      // Add new member
      updatedMembers = [...existingMembers, newMember];
    }

    const cache: FamilyMemberCache = {
      userId,
      members: updatedMembers,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving family member:", error);
  }
}

/**
 * Get family members by relationship type
 */
export function getFamilyMembersByRelationship(
  userId: string,
  relationship: FamilyMember["relationship"]
): FamilyMember[] {
  const members = getFamilyMemberCache(userId);
  return members.filter((m) => m.relationship === relationship);
}

/**
 * Get most recently used family member of a given type
 */
export function getMostRecentFamilyMember(
  userId: string,
  relationship: FamilyMember["relationship"]
): FamilyMember | null {
  const members = getFamilyMembersByRelationship(userId, relationship);
  if (members.length === 0) return null;

  // Sort by lastUsedAt descending
  const sorted = members.sort((a, b) => {
    const dateA = new Date(a.lastUsedAt || a.savedAt).getTime();
    const dateB = new Date(b.lastUsedAt || b.savedAt).getTime();
    return dateB - dateA;
  });

  return sorted[0];
}

/**
 * Convert Part2 (claimant) data to FamilyMember format
 */
export function claimantToFamilyMember(
  claimant: Partial<Part2ClaimantInfo>,
  relationship: FamilyMember["relationship"],
  claimId?: string
): Omit<FamilyMember, "savedAt" | "lastUsedAt"> {
  return {
    id: `claimant_${Date.now()}`,
    relationship,
    firstName: claimant.firstName || "",
    middleName: claimant.middleName,
    lastName: claimant.lastName || "",
    formerNames: claimant.formerNames,
    ssn: claimant.ssn,
    dob: claimant.dob,
    dod: claimant.dod,
    claimIds: claimId ? [claimId] : [],
  };
}

/**
 * Convert Part1 (filer) data to FamilyMember format
 */
export function filerToFamilyMember(
  filer: Partial<Part1FilerInfo>,
  claimId?: string
): Omit<FamilyMember, "savedAt" | "lastUsedAt"> {
  return {
    id: `filer_${Date.now()}`,
    relationship: "self",
    firstName: filer.firstName || "",
    middleName: filer.middleName,
    lastName: filer.lastName || "",
    formerNames: filer.formerNames,
    ssn: filer.ssn,
    dob: filer.dob,
    address: filer.mailingAddress,
    city: filer.city,
    state: filer.state,
    zipCode: filer.zipCode,
    phone: filer.phoneDay || filer.phoneEvening,
    email: filer.email,
    claimIds: claimId ? [claimId] : [],
  };
}

/**
 * Convert FamilyMember to Part2 (claimant) format
 */
export function familyMemberToClaimant(
  member: FamilyMember
): Partial<Part2ClaimantInfo> {
  return {
    firstName: member.firstName,
    middleName: member.middleName,
    lastName: member.lastName,
    formerNames: member.formerNames,
    ssn: member.ssn,
    dob: member.dob,
    dod: member.dod,
  };
}

/**
 * Convert FamilyMember to Part1 (filer) format
 */
export function familyMemberToFiler(
  member: FamilyMember
): Partial<Part1FilerInfo> {
  return {
    firstName: member.firstName,
    middleName: member.middleName,
    lastName: member.lastName,
    formerNames: member.formerNames,
    ssn: member.ssn,
    dob: member.dob,
    mailingAddress: member.address,
    city: member.city,
    state: member.state,
    zipCode: member.zipCode,
    phoneDay: member.phone,
    email: member.email,
  };
}

/**
 * Mark family member as recently used
 */
export function markFamilyMemberUsed(userId: string, memberId: string): void {
  if (typeof window === "undefined") return;

  try {
    const members = getFamilyMemberCache(userId);
    const memberIndex = members.findIndex((m) => m.id === memberId);

    if (memberIndex >= 0) {
      members[memberIndex].lastUsedAt = new Date().toISOString();

      const cache: FamilyMemberCache = {
        userId,
        members,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error("Error marking family member as used:", error);
  }
}

/**
 * Clear family member cache (logout, clear data, etc.)
 */
export function clearFamilyMemberCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all deceased family members (common for RECA claims)
 */
export function getDeceasedFamilyMembers(userId: string): FamilyMember[] {
  const members = getFamilyMemberCache(userId);
  return members.filter((m) => m.dod !== undefined && m.dod !== "");
}

/**
 * Suggest family members based on relationship context
 *
 * Example: When filing as "Child", suggest deceased parents
 */
export function suggestFamilyMembers(
  userId: string,
  relationship:
    | "Self"
    | "Spouse"
    | "Child"
    | "Parent"
    | "Grandchild"
    | "Grandparent"
): FamilyMember[] {
  const deceased = getDeceasedFamilyMembers(userId);

  switch (relationship) {
    case "Child":
      // Suggest parents
      return deceased.filter((m) => m.relationship === "parent");

    case "Spouse":
      // Suggest spouses
      return deceased.filter((m) => m.relationship === "spouse");

    case "Parent":
      // Suggest children
      return deceased.filter((m) => m.relationship === "child");

    case "Grandchild":
      // Suggest grandparents (could be stored as parent's parent)
      return deceased.filter((m) => m.relationship === "parent");

    default:
      // Return all deceased
      return deceased;
  }
}
