import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET all waitlist entries (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    // Check if user is authenticated and is admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tier = url.searchParams.get("tier"); // Filter by service tier
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (tier) whereClause.interestedTier = tier;

    const waitlistEntries = await db.registrationWaitlist.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get counts by status
    const statusCounts = await db.registrationWaitlist.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get counts by tier
    const tierCounts = await db.registrationWaitlist.groupBy({
      by: ["interestedTier"],
      _count: true,
    });

    return NextResponse.json({
      entries: waitlistEntries,
      counts: statusCounts.reduce(
        (acc, { status, _count }) => {
          acc[status] = _count;
          return acc;
        },
        {} as Record<string, number>
      ),
      tierCounts: tierCounts.reduce(
        (acc, { interestedTier, _count }) => {
          if (interestedTier) acc[interestedTier] = _count;
          return acc;
        },
        {} as Record<string, number>
      ),
      total: waitlistEntries.length,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// PATCH to update waitlist entry status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Waitlist entry ID required" },
        { status: 400 }
      );
    }

    const updated = await db.registrationWaitlist.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        contactedAt: status === "CONTACTED" ? new Date() : undefined,
        contactedBy: status === "CONTACTED" ? session.user.id : undefined,
      },
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}
