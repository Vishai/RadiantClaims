import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const COLLABORATION_SCHEMA_ERROR =
  "Family collaboration is temporarily unavailable because the database schema is out of date. Run the latest Prisma migrations and redeploy.";

export function createCollaborationErrorResponse(
  error: unknown,
  operation: string
) {
  console.error(`[collaboration/${operation}]`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return NextResponse.json(
        { error: COLLABORATION_SCHEMA_ERROR, code: error.code },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Database error while processing family collaboration request.",
        code: error.code,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
