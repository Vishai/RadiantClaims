/**
 * React Hook for Family Member Cache Auto-Save
 *
 * Automatically saves family member data to localStorage cache when
 * claim forms are completed. This allows users to reuse information
 * when filing multiple claims (e.g., filing for both parents).
 */

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  saveFamilyMember,
  claimantToFamilyMember,
  filerToFamilyMember,
  type FamilyMember,
} from "./family-member-cache";
import type { RECAFormData, Part2ClaimantInfo, Part1FilerInfo } from "./types";

export interface UseFamilyMemberCacheOptions {
  claimId?: string;
  formData?: Partial<RECAFormData>;
  autoSave?: boolean; // Default: true
}

/**
 * Hook to automatically save family members to cache
 *
 * Usage:
 * ```typescript
 * const { saveClaimant, saveFiler, saveSpouse, saveSibling } = useFamilyMemberCache({
 *   claimId: 'claim_123',
 *   formData: currentFormData,
 *   autoSave: true, // Auto-save on formData changes
 * });
 * ```
 */
export function useFamilyMemberCache(
  options: UseFamilyMemberCacheOptions = {}
) {
  const { data: session } = useSession();
  const { claimId, formData, autoSave = true } = options;

  /**
   * Save claimant (Part 2) to family member cache
   */
  const saveClaimant = (claimant: Partial<Part2ClaimantInfo>) => {
    if (!session?.user?.id || !claimant.firstName || !claimant.lastName) {
      return;
    }

    const relationship = formData?.part_3?.relationship;
    let memberRelationship: FamilyMember["relationship"] = "parent"; // Default

    // Determine relationship based on who is filing
    switch (relationship) {
      case "Child":
        memberRelationship = "parent";
        break;
      case "Spouse":
        memberRelationship = "spouse";
        break;
      case "Parent":
        memberRelationship = "child";
        break;
      case "Self":
        memberRelationship = "self";
        break;
      default:
        memberRelationship = "parent";
    }

    const familyMember = claimantToFamilyMember(
      claimant,
      memberRelationship,
      claimId
    );

    saveFamilyMember(session.user.id, familyMember);
  };

  /**
   * Save filer (Part 1) to family member cache as 'self'
   */
  const saveFiler = (filer: Partial<Part1FilerInfo>) => {
    if (!session?.user?.id || !filer.firstName || !filer.lastName) {
      return;
    }

    const familyMember = filerToFamilyMember(filer, claimId);
    saveFamilyMember(session.user.id, familyMember);
  };

  /**
   * Save spouse information from Part 5
   */
  const saveSpouse = (
    spouseName: string,
    marriageStart?: string,
    marriageEnd?: string
  ) => {
    if (!session?.user?.id || !spouseName) {
      return;
    }

    const [firstName, ...lastNameParts] = spouseName.split(" ");
    const lastName = lastNameParts.join(" ");

    const familyMember: Omit<FamilyMember, "savedAt" | "lastUsedAt"> = {
      id: `spouse_${Date.now()}`,
      relationship: "spouse",
      firstName: firstName || spouseName,
      lastName: lastName || "",
      claimIds: claimId ? [claimId] : [],
    };

    saveFamilyMember(session.user.id, familyMember);
  };

  /**
   * Save sibling information from Part 6
   */
  const saveSibling = (sibling: {
    name: string;
    dateOfBirth?: string;
    isDeceased?: "YES" | "NO";
    dateOfDeath?: string;
  }) => {
    if (!session?.user?.id || !sibling.name) {
      return;
    }

    const [firstName, ...lastNameParts] = sibling.name.split(" ");
    const lastName = lastNameParts.join(" ");

    const familyMember: Omit<FamilyMember, "savedAt" | "lastUsedAt"> = {
      id: `sibling_${Date.now()}`,
      relationship: "sibling",
      firstName: firstName || sibling.name,
      lastName: lastName || "",
      dob: sibling.dateOfBirth,
      dod: sibling.isDeceased === "YES" ? sibling.dateOfDeath : undefined,
      claimIds: claimId ? [claimId] : [],
    };

    saveFamilyMember(session.user.id, familyMember);
  };

  /**
   * Auto-save family members when form data changes
   */
  useEffect(() => {
    if (!autoSave || !formData || !session?.user?.id) {
      return;
    }

    // Save filer info (Part 1)
    if (formData.part_1) {
      saveFiler(formData.part_1);
    }

    // Save claimant info (Part 2)
    if (formData.part_2) {
      saveClaimant(formData.part_2);
    }

    // Save spouse info (Part 5)
    if (formData.part_5?.claimantPreviousSpouses) {
      formData.part_5.claimantPreviousSpouses.forEach((spouse) => {
        saveSpouse(spouse.spouseName, spouse.marriageStart, spouse.marriageEnd);
      });
    }

    if (formData.part_5?.filerOtherSpouses) {
      formData.part_5.filerOtherSpouses.forEach((spouse) => {
        saveSpouse(spouse.spouseName, spouse.marriageStart, spouse.marriageEnd);
      });
    }

    // Save sibling info (Part 6)
    if (formData.part_6?.siblings) {
      formData.part_6.siblings.forEach((sibling) => {
        saveSibling({
          name: sibling.name,
          dateOfBirth: sibling.dateOfBirth,
          isDeceased: sibling.isDeceased,
          dateOfDeath: sibling.dateOfDeath,
        });
      });
    }
  }, [formData, session?.user?.id, claimId, autoSave]);

  return {
    saveClaimant,
    saveFiler,
    saveSpouse,
    saveSibling,
  };
}

/**
 * Hook to save family members on claim completion
 *
 * Call this when the user successfully completes a claim.
 *
 * Usage:
 * ```typescript
 * const { saveAllFamilyMembers } = useSaveOnClaimComplete();
 *
 * // When claim is completed:
 * saveAllFamilyMembers({
 *   claimId: 'claim_123',
 *   formData: completedFormData,
 * });
 * ```
 */
export function useSaveOnClaimComplete() {
  const { data: session } = useSession();

  const saveAllFamilyMembers = (options: {
    claimId: string;
    formData: Partial<RECAFormData>;
  }) => {
    if (!session?.user?.id) {
      console.warn("Cannot save family members: No active session");
      return;
    }

    const { claimId, formData } = options;

    // Save filer
    if (formData.part_1) {
      const filerMember = filerToFamilyMember(formData.part_1, claimId);
      saveFamilyMember(session.user.id, filerMember);
    }

    // Save claimant
    if (formData.part_2) {
      const relationship = formData.part_3?.relationship;
      let memberRelationship: FamilyMember["relationship"] = "parent";

      switch (relationship) {
        case "Child":
          memberRelationship = "parent";
          break;
        case "Spouse":
          memberRelationship = "spouse";
          break;
        case "Parent":
          memberRelationship = "child";
          break;
        case "Self":
          memberRelationship = "self";
          break;
      }

      const claimantMember = claimantToFamilyMember(
        formData.part_2,
        memberRelationship,
        claimId
      );
      saveFamilyMember(session.user.id, claimantMember);
    }

    // Save spouses
    if (formData.part_5?.claimantPreviousSpouses) {
      formData.part_5.claimantPreviousSpouses.forEach((spouse) => {
        const [firstName, ...lastNameParts] = spouse.spouseName.split(" ");
        const familyMember: Omit<FamilyMember, "savedAt" | "lastUsedAt"> = {
          id: `spouse_${Date.now()}_${Math.random()}`,
          relationship: "spouse",
          firstName: firstName || spouse.spouseName,
          lastName: lastNameParts.join(" ") || "",
          claimIds: [claimId],
        };
        saveFamilyMember(session.user.id, familyMember);
      });
    }

    // Save siblings
    if (formData.part_6?.siblings) {
      formData.part_6.siblings.forEach((sibling) => {
        const [firstName, ...lastNameParts] = sibling.name.split(" ");
        const familyMember: Omit<FamilyMember, "savedAt" | "lastUsedAt"> = {
          id: `sibling_${Date.now()}_${Math.random()}`,
          relationship: "sibling",
          firstName: firstName || sibling.name,
          lastName: lastNameParts.join(" ") || "",
          dob: sibling.dateOfBirth,
          dod: sibling.isDeceased === "YES" ? sibling.dateOfDeath : undefined,
          claimIds: [claimId],
        };
        saveFamilyMember(session.user.id, familyMember);
      });
    }

    console.log(`✅ Family members saved to cache for claim ${claimId}`);
  };

  return {
    saveAllFamilyMembers,
  };
}
