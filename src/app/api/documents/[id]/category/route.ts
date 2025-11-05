import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";

// PATCH - Update document category
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { category, categoryLocked, source } = body;

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Find the file
    const file = await db.uploadedFile.findUnique({
      where: { id },
      include: {
        intakeSession: {
          include: {
            claim: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check authorization - user must own the file or be an admin
    const isAuthorized =
      file.intakeSession?.claim?.userId === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "ATTORNEY";

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current metadata to preserve other fields
    const currentMetadata = (file.metadata as any) || {};

    // Update the category and metadata
    const updatedFile = await db.uploadedFile.update({
      where: { id },
      data: {
        category,
        metadata: {
          ...currentMetadata,
          categoryInsights: {
            ...currentMetadata.categoryInsights,
            finalCategory: category,
            categoryLocked: categoryLocked ?? false,
            categorySource: source || "user_manual",
            categoryUpdatedAt: new Date().toISOString(),
            categoryUpdatedBy: session.user.id,
          },
        },
      },
    });

    console.log(
      `✅ Updated document ${id} category to ${category} (source: ${source})`
    );

    return NextResponse.json(
      { success: true, file: updatedFile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
