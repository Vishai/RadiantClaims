import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED_PHASES = new Set(["started", "completed"]);
const ALLOWED_RESULTS = new Set(["likely", "unlikely", "ineligible"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      phase,
      result,
      intent,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body ?? {};

    if (typeof phase !== "string" || !ALLOWED_PHASES.has(phase)) {
      return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
    }

    if (
      phase === "completed" &&
      (typeof result !== "string" || !ALLOWED_RESULTS.has(result))
    ) {
      return NextResponse.json(
        { error: "Invalid result for completed phase" },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    await db.eligibilityEvent.create({
      data: {
        phase,
        result: phase === "completed" ? (result as string) : null,
        intent: typeof intent === "string" ? intent.slice(0, 64) : null,
        referrer: typeof referrer === "string" ? referrer.slice(0, 512) : null,
        utmSource:
          typeof utmSource === "string" ? utmSource.slice(0, 128) : null,
        utmMedium:
          typeof utmMedium === "string" ? utmMedium.slice(0, 128) : null,
        utmCampaign:
          typeof utmCampaign === "string" ? utmCampaign.slice(0, 128) : null,
        ipAddress,
        userAgent: userAgent ? userAgent.slice(0, 512) : null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("eligibility-event log failed:", error);
    return NextResponse.json({ error: "Log failed" }, { status: 500 });
  }
}
