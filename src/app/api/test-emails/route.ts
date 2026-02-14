import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendResourceSuccessEmail } from "@/lib/email";

/**
 * Test endpoint to preview/send resource emails
 * GET /api/test-emails?type=success
 * Admin-only
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get("type") || "success";
  const email =
    request.nextUrl.searchParams.get("email") || "brandon@radiantclaims.com";

  try {
    if (type === "success") {
      const result = await sendResourceSuccessEmail({
        to: email,
        claimantName: "Brandon",
        officeName: "Colorado Department of Public Health & Environment",
        documentType: "Birth Certificate",
        uploadUrl: "http://localhost:3000/portal/documents",
      });

      return NextResponse.json({
        success: true,
        message: "Success email sent!",
        result,
      });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
