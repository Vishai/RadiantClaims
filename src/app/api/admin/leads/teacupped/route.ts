/**
 * Teacupped Leads API
 *
 * Returns leads who completed eligibility screening but haven't converted to paying customers.
 * This is your goldmine for follow-up campaigns and conversion optimization.
 *
 * "Teacupped" = completed eligibility, got excited, but didn't finish signup/payment
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can access lead data
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const eligibilityFilter = searchParams.get("eligibility");
    const daysOld = parseInt(searchParams.get("daysOld") || "30");

    // Calculate date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysOld);

    // Build query filters
    const whereClause: any = {
      createdAt: { gte: thresholdDate },
      // Teacupped = completed eligibility but not converted
      leadStatus: {
        in: ["NEW", "CONTACTED", "ENGAGED", "NURTURING", "COLD"],
      },
      conversionStage: {
        in: ["ELIGIBILITY_COMPLETED", "ACCOUNT_CREATED"],
      },
    };

    // Filter by eligibility status
    if (eligibilityFilter) {
      whereClause.eligibilityStatus = eligibilityFilter;
    }

    // Apply specific filters
    switch (filter) {
      case "hot":
        // Completed eligibility in last 7 days, haven't been contacted
        whereClause.createdAt = {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        };
        whereClause.leadStatus = "NEW";
        whereClause.eligibilityStatus = { in: ["likely", "needs-review"] };
        break;

      case "warm":
        // Completed 7-30 days ago, contacted but not engaged
        whereClause.createdAt = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        };
        whereClause.leadStatus = { in: ["NEW", "CONTACTED"] };
        break;

      case "cold":
        // Older than 30 days, no response
        whereClause.leadStatus = "COLD";
        break;

      case "needsFollowUp":
        // Anyone who hasn't been contacted in 3+ days
        whereClause.OR = [
          { lastContactedAt: null },
          {
            lastContactedAt: {
              lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
          },
        ];
        whereClause.leadStatus = { notIn: ["CONVERTED", "CHURNED", "COLD"] };
        break;

      case "likely":
        // Only those with "likely" eligibility status
        whereClause.eligibilityStatus = "likely";
        whereClause.leadStatus = { in: ["NEW", "CONTACTED", "ENGAGED"] };
        break;
    }

    const teacuppedLeads = await db.claimant.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        leadStatus: true,
        eligibilityStatus: true,
        conversionStage: true,
        lastContactedAt: true,
        followUpCount: true,
        eligibilityData: true,
        cancerType: true,
        relationshipToClaimant: true,
        state: true,
        county: true,
        referralCode: true,
      },
      orderBy: [
        { eligibilityStatus: "asc" }, // "likely" first
        { createdAt: "desc" }, // Most recent first
      ],
      take: 100, // Limit for performance
    });

    // Calculate statistics
    const stats = {
      total: teacuppedLeads.length,
      byEligibility: {
        likely: teacuppedLeads.filter((l) => l.eligibilityStatus === "likely")
          .length,
        needsReview: teacuppedLeads.filter(
          (l) => l.eligibilityStatus === "needs-review"
        ).length,
        unlikely: teacuppedLeads.filter(
          (l) => l.eligibilityStatus === "unlikely"
        ).length,
        ineligible: teacuppedLeads.filter(
          (l) => l.eligibilityStatus === "ineligible"
        ).length,
      },
      byLeadStatus: {
        new: teacuppedLeads.filter((l) => l.leadStatus === "NEW").length,
        contacted: teacuppedLeads.filter((l) => l.leadStatus === "CONTACTED")
          .length,
        engaged: teacuppedLeads.filter((l) => l.leadStatus === "ENGAGED")
          .length,
        cold: teacuppedLeads.filter((l) => l.leadStatus === "COLD").length,
      },
      needingFollowUp: teacuppedLeads.filter(
        (l) =>
          !l.lastContactedAt ||
          new Date(l.lastContactedAt).getTime() <
            Date.now() - 3 * 24 * 60 * 60 * 1000
      ).length,
    };

    // Parse eligibility data for richer insights
    const enrichedLeads = teacuppedLeads.map((lead) => {
      const eligData = lead.eligibilityData as any;
      return {
        ...lead,
        enrichedData: eligData
          ? {
              intent: eligData.intent,
              relationship: eligData.relationship,
              deceasedName: eligData.deceasedFirstName
                ? `${eligData.deceasedFirstName} ${eligData.deceasedLastName}`
                : null,
              deceasedDOD: eligData.deceasedDOD,
              residenceState: eligData.residenceState,
              county: eligData.arizonaCounty || eligData.nevadaCounty,
              cancerType: eligData.cancerType,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      filter,
      daysOld,
      stats,
      leads: enrichedLeads,
      message: `Found ${teacuppedLeads.length} teacupped leads`,
    });
  } catch (error) {
    console.error("Error fetching teacupped leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacupped leads" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to update lead status (mark as contacted, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { claimantId, leadStatus, teacupReason } = body;

    if (!claimantId) {
      return NextResponse.json(
        { error: "claimantId is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      lastContactedAt: new Date(),
      followUpCount: { increment: 1 },
    };

    if (leadStatus) {
      updateData.leadStatus = leadStatus;
    }

    if (teacupReason) {
      updateData.teacupReason = teacupReason;
    }

    const updated = await db.claimant.update({
      where: { id: claimantId },
      data: updateData,
    });

    // TODO: Log this contact attempt in ClaimantComment or a follow-up log

    return NextResponse.json({
      success: true,
      claimant: {
        id: updated.id,
        leadStatus: updated.leadStatus,
        followUpCount: updated.followUpCount,
        lastContactedAt: updated.lastContactedAt,
      },
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
