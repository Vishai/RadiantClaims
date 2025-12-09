/**
 * Family Member Selector Component
 *
 * Allows users to quickly select from previously entered family members
 * when filing multiple claims (e.g., filing for both parents).
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  getFamilyMemberCache,
  suggestFamilyMembers,
  familyMemberToClaimant,
  markFamilyMemberUsed,
  type FamilyMember,
} from "@/lib/reca/family-member-cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, Sparkles } from "lucide-react";
import type { Part2ClaimantInfo, RelationshipType } from "@/lib/reca/types";

export interface FamilyMemberSelectorProps {
  relationship?: RelationshipType;
  onSelect: (claimant: Partial<Part2ClaimantInfo>, memberId: string) => void;
  onSkip: () => void;
  className?: string;
}

export function FamilyMemberSelector({
  relationship,
  onSelect,
  onSkip,
  className = "",
}: FamilyMemberSelectorProps) {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<FamilyMember[]>([]);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Get all family members
    const members = getFamilyMemberCache(session.user.id);
    setAllMembers(members);

    // Get relationship-specific suggestions
    if (relationship) {
      const suggested = suggestFamilyMembers(session.user.id, relationship);
      setSuggestions(suggested);
    } else {
      setSuggestions(members);
    }
  }, [session?.user?.id, relationship]);

  const handleSelect = (member: FamilyMember) => {
    if (!session?.user?.id) return;

    const claimantData = familyMemberToClaimant(member);
    markFamilyMemberUsed(session.user.id, member.id);
    onSelect(claimantData, member.id);
  };

  const displayedMembers = showAll ? allMembers : suggestions;

  if (displayedMembers.length === 0) {
    return null; // No cached family members to show
  }

  return (
    <Card
      className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white ${className}`}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">
            Quick Fill from Previous Claims
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          {relationship ? (
            <>
              We found {displayedMembers.length} family member
              {displayedMembers.length > 1 ? "s" : ""} you've previously
              entered. Select one to auto-fill this claim.
            </>
          ) : (
            <>
              Select from {displayedMembers.length} previously entered family
              member{displayedMembers.length > 1 ? "s" : ""}.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedMembers.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            onSelect={() => handleSelect(member)}
          />
        ))}

        <div className="flex gap-3 border-t border-blue-200 pt-3">
          {!showAll && allMembers.length > suggestions.length && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
              className="border-blue-300 text-blue-700"
            >
              <Users className="mr-2 h-4 w-4" />
              Show All ({allMembers.length})
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSkip}
            className="ml-auto"
          >
            Enter New Person
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FamilyMemberCardProps {
  member: FamilyMember;
  onSelect: () => void;
}

function FamilyMemberCard({ member, onSelect }: FamilyMemberCardProps) {
  const fullName = [member.firstName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(" ");

  const formattedDOB = member.dob
    ? new Date(member.dob).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const formattedDOD = member.dod
    ? new Date(member.dod).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const claimCount = member.claimIds?.length || 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg border-2 border-blue-200 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-100/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{fullName}</h4>
            {member.relationship && (
              <Badge variant="outline" className="text-xs">
                {member.relationship}
              </Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            {formattedDOB && (
              <p>
                <span className="text-gray-500">Born:</span> {formattedDOB}
              </p>
            )}
            {formattedDOD && (
              <p>
                <span className="text-gray-500">Died:</span> {formattedDOD}
              </p>
            )}
            {member.formerNames && (
              <p className="text-xs text-gray-500">
                Former name: {member.formerNames}
              </p>
            )}
          </div>

          {member.lastUsedAt && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Last used{" "}
              {new Date(member.lastUsedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {claimCount > 0 && (
                <span className="ml-2">
                  • Used in {claimCount} claim{claimCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-blue-600" />
        </div>
      </div>
    </button>
  );
}

/**
 * Compact inline family member selector (for forms)
 */
export interface InlineFamilyMemberSelectorProps {
  relationship?: RelationshipType;
  onSelect: (claimant: Partial<Part2ClaimantInfo>) => void;
  label?: string;
}

export function InlineFamilyMemberSelector({
  relationship,
  onSelect,
  label = "Use Previously Entered Family Member",
}: InlineFamilyMemberSelectorProps) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    if (relationship) {
      const suggested = suggestFamilyMembers(session.user.id, relationship);
      setMembers(suggested);
    } else {
      const all = getFamilyMemberCache(session.user.id);
      setMembers(all);
    }
  }, [session?.user?.id, relationship]);

  if (members.length === 0) return null;

  const handleSelect = (member: FamilyMember) => {
    if (!session?.user?.id) return;

    const claimantData = familyMemberToClaimant(member);
    markFamilyMemberUsed(session.user.id, member.id);
    onSelect(claimantData);
  };

  return (
    <div className="rounded-lg border border-sage-200 bg-gradient-to-r from-sage-50 to-cream-50 p-3">
      <p className="mb-2 text-sm font-medium text-sage-900">{label}:</p>
      <div className="space-y-2">
        {members.slice(0, 3).map((member) => {
          const fullName = [
            member.firstName,
            member.middleName,
            member.lastName,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Button
              key={member.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSelect(member)}
              className="w-full justify-start text-left font-normal"
            >
              <Users className="mr-2 h-4 w-4 text-sage-600" />
              <span className="flex-1">{fullName}</span>
              {member.dod && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Deceased
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      {members.length > 3 && (
        <p className="mt-2 text-xs text-gray-500">
          +{members.length - 3} more available
        </p>
      )}
    </div>
  );
}
