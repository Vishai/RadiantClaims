/**
 * Redeem Promo Code & Auto-Generate Referral Code
 *
 * When a user redeems certain promo codes (like IKNOWBRANDON),
 * this endpoint:
 * 1. Validates the promo code
 * 2. Creates/retrieves a referral code for the user
 * 3. Returns both the discount info and their unique referral code
 *
 * This allows VIP users to get free access AND become referral partners.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { promoCode } = await req.json();

    if (!promoCode) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    const normalizedCode = promoCode.trim().toUpperCase();

    // Validate promo code
    const promoCodeRecord = await db.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!promoCodeRecord) {
      return NextResponse.json(
        { error: "Invalid promo code" },
        { status: 404 }
      );
    }

    if (!promoCodeRecord.isActive) {
      return NextResponse.json(
        { error: "This promo code is no longer active" },
        { status: 400 }
      );
    }

    if (promoCodeRecord.expiresAt && promoCodeRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This promo code has expired" },
        { status: 400 }
      );
    }

    if (
      promoCodeRecord.maxUses &&
      promoCodeRecord.currentUses >= promoCodeRecord.maxUses
    ) {
      return NextResponse.json(
        { error: "This promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Check if user already has a referral code
    const existingReferral = await db.referral.findFirst({
      where: {
        contact: session.user.email,
      },
    });

    let referralRecord = existingReferral;

    // Generate referral code if they don't have one
    if (!referralRecord) {
      // Create a memorable referral code based on user's name or email
      const userName = session.user.name || session.user.email.split("@")[0];
      const cleanName = userName
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .substring(0, 8);
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const referralCode = `${cleanName}-${randomSuffix}`;

      // Create referral record
      referralRecord = await db.referral.create({
        data: {
          code: referralCode,
          referrerName: session.user.name || userName,
          contact: session.user.email,
          notes: `Auto-generated from promo code: ${normalizedCode}. User can earn $50 per approved referral.`,
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "REFERRAL_CODE_CREATED",
          resourceType: "Referral",
          resourceId: referralRecord.id,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || undefined,
          metadata: JSON.stringify({
            promoCode: normalizedCode,
            referralCode: referralRecord.code,
            method: "auto-generated",
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      promoCode: {
        code: promoCodeRecord.code,
        type: promoCodeRecord.type,
        description: promoCodeRecord.description,
        percentOff: promoCodeRecord.percentOff,
        duration: promoCodeRecord.duration,
      },
      referralCode: {
        code: referralRecord.code,
        message:
          "You can now share your referral code and earn $50 per approved claim!",
        rewardAmount: 50,
      },
    });
  } catch (error) {
    console.error("Error redeeming promo code:", error);
    return NextResponse.json(
      {
        error: "Failed to redeem promo code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
