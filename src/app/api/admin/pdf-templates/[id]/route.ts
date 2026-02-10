import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/pdf-templates/[id] - Get a specific PDF template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // In production, fetch from database
    // For now, return mock data
    if (id === "reca-default") {
      const template = {
        id: "reca-default",
        name: "RECA Downwinder Claim Form",
        description: "Official DOJ RECA claim form with all 16 parts",
        formType: "RECA",
        version: "2024-10",
        fieldMappings: [], // Would be fetched from DB
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ template });
    }

    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/pdf-templates/[id] - Update a PDF template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.formType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, update in database
    // For now, store in memory or return the updated template
    console.log(`Updating template ${id} with:`, body);

    // You could store this in a temporary file or in-memory store for testing
    const updatedTemplate = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pdf-templates/[id] - Delete a PDF template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // In production, delete from database
    console.log(`Deleting template ${id}`);

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
