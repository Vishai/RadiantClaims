import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAutoImportStats } from "@/lib/contact-agent/auto-import";

/**
 * GET /api/admin/contacts/auto-imported
 *
 * Get statistics and list of auto-imported contacts for admin review
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      // Get statistics
      const stats = await getAutoImportStats();
      return NextResponse.json(stats);
    }

    // Get list of auto-imported contacts
    const needsReview = searchParams.get("needsReview") === "true";

    const contacts = await prisma.documentResource.findMany({
      where: {
        notes: {
          contains: needsReview
            ? "AI-verified only - needs human review"
            : "Auto-imported from web search",
        },
      },
      orderBy: { lastUpdated: "desc" },
      take: 50,
    });

    return NextResponse.json({ contacts, count: contacts.length });
  } catch (error) {
    console.error("Error fetching auto-imported contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/contacts/auto-imported
 *
 * Approve or reject an auto-imported contact
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { contactId, action, reason } = body;

    if (!contactId || !action) {
      return NextResponse.json(
        { error: "contactId and action are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.documentResource.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Remove "needs review" from notes
      const updatedNotes = contact.notes
        ?.replace("⚠️ AI-verified only - needs human review", "")
        .replace(/\n\n+/g, "\n\n")
        .trim();

      await prisma.documentResource.update({
        where: { id: contactId },
        data: {
          notes: `${updatedNotes}\n\n✅ Approved by ${session.user.name || session.user.email} on ${new Date().toISOString()}`,
        },
      });

      return NextResponse.json({ success: true, action: "approved" });
    } else if (action === "reject") {
      // Delete the contact
      await prisma.documentResource.delete({
        where: { id: contactId },
      });

      // Optionally log the rejection
      console.log(
        `[Auto-Import] Rejected contact: ${contact.name} - Reason: ${reason || "Not specified"}`
      );

      return NextResponse.json({ success: true, action: "rejected" });
    } else if (action === "edit") {
      // Allow admin to edit the contact
      const { updates } = body;

      await prisma.documentResource.update({
        where: { id: contactId },
        data: {
          ...updates,
          notes: `${contact.notes}\n\n✏️ Edited by ${session.user.name || session.user.email} on ${new Date().toISOString()}`,
        },
      });

      return NextResponse.json({ success: true, action: "edited" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing auto-imported contact:", error);
    return NextResponse.json(
      { error: "Failed to manage contact" },
      { status: 500 }
    );
  }
}
