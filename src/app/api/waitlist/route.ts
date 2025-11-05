import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { WaitlistStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      phone,
      claimType,
      interestedTier,
      firmPreference,
      source,
      referralCode,
    } = body;

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get IP address for tracking
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Extract UTM parameters from query string if available
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    // Check if email already exists in waitlist
    const existingEntry = await db.registrationWaitlist.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEntry) {
      // Update existing entry - increment submission count
      await db.registrationWaitlist.update({
        where: { email: email.toLowerCase() },
        data: {
          submittedCount: { increment: 1 },
          lastSubmitIp: ipAddress,
          name: name || existingEntry.name,
          phone: phone || existingEntry.phone,
          claimType: claimType || existingEntry.claimType,
          interestedTier: interestedTier || existingEntry.interestedTier,
          firmPreference: firmPreference || existingEntry.firmPreference,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message:
            "You're already on our waitlist! We'll notify you when registration opens.",
          alreadyExists: true,
        },
        { status: 200 }
      );
    }

    // Create new waitlist entry
    const waitlistEntry = await db.registrationWaitlist.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        phone: phone || null,
        claimType: claimType || null,
        interestedTier: interestedTier || null,
        firmPreference: firmPreference || null,
        source: source || "unknown",
        referralCode: referralCode || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        lastSubmitIp: ipAddress,
        status: WaitlistStatus.PENDING,
      },
    });

    // TODO: Send confirmation email via Resend
    // await sendWaitlistConfirmationEmail(email, name);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! We'll notify you as soon as registration opens.",
        waitlistId: waitlistEntry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      {
        error: "Failed to join waitlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check waitlist status (optional)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 }
      );
    }

    const entry = await db.registrationWaitlist.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        status: true,
        createdAt: true,
        notificationSent: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json(
      {
        exists: true,
        status: entry.status,
        joinedAt: entry.createdAt,
        notificationSent: entry.notificationSent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking waitlist:", error);
    return NextResponse.json(
      { error: "Failed to check waitlist status" },
      { status: 500 }
    );
  }
}
