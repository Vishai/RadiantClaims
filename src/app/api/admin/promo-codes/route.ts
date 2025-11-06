/**
 * Admin API for Managing Promo Codes
 *
 * This route allows admins to create and manage promo codes for:
 * - Pilot accounts (free usage)
 * - Discounts (percentage or fixed amount)
 * - Waiving setup fees
 * - Free trials
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * GET - List all promo codes (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ promoCodes });
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new promo code (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const {
      code,
      type,
      description,
      percentOff,
      amountOff,
      freeTrialDays,
      duration,
      durationInMonths,
      allowedTiers,
      maxUses,
      expiresAt,
      createStripeCoupon,
      notes,
    } = await req.json();

    // Validate required fields
    if (!code || !type) {
      return NextResponse.json(
        { error: "Code and type are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      );
    }

    // Create Stripe coupon if requested
    let stripeCouponId = null;
    if (createStripeCoupon) {
      try {
        // Map duration to Stripe format
        let stripeDuration: "once" | "repeating" | "forever" = "once";
        let stripeDurationInMonths: number | undefined;

        if (duration === "ONCE") {
          stripeDuration = "once";
        } else if (duration === "REPEATING") {
          stripeDuration = "repeating";
          stripeDurationInMonths = durationInMonths || 12;
        } else if (duration === "FOREVER") {
          stripeDuration = "forever";
        }

        if (type === "PERCENT_OFF" && percentOff) {
          const coupon = await stripe.coupons.create({
            percent_off: percentOff,
            duration: stripeDuration,
            ...(stripeDuration === "repeating" && {
              duration_in_months: stripeDurationInMonths,
            }),
            name: code,
            metadata: {
              promoCode: code,
              type,
            },
          });
          stripeCouponId = coupon.id;
        } else if (type === "AMOUNT_OFF" && amountOff) {
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(amountOff * 100), // Convert to cents
            currency: "usd",
            duration: stripeDuration,
            ...(stripeDuration === "repeating" && {
              duration_in_months: stripeDurationInMonths,
            }),
            name: code,
            metadata: {
              promoCode: code,
              type,
            },
          });
          stripeCouponId = coupon.id;
        } else if (type === "PILOT_ACCOUNT") {
          // For pilot accounts, create 100% off coupon with specified duration
          const coupon = await stripe.coupons.create({
            percent_off: 100,
            duration: stripeDuration,
            ...(stripeDuration === "repeating" && {
              duration_in_months: stripeDurationInMonths,
            }),
            name: code,
            metadata: {
              promoCode: code,
              type: "PILOT_ACCOUNT",
            },
          });
          stripeCouponId = coupon.id;
        }
      } catch (stripeError) {
        console.error("Error creating Stripe coupon:", stripeError);
        // Continue without Stripe coupon - we can still create the promo code
      }
    }

    // Create promo code in database
    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        type,
        description,
        percentOff,
        amountOff,
        freeTrialDays,
        duration: duration || "ONCE",
        durationInMonths,
        allowedTiers: allowedTiers || [],
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        stripeCouponId,
        createdBy: session.user.id,
        notes,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROMO_CODE_CREATED",
        resourceType: "PromoCode",
        resourceId: promoCode.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          code,
          type,
          stripeCouponId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      promoCode,
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      {
        error: "Failed to create promo code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update an existing promo code (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id, isActive, maxUses, expiresAt, notes } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      );
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        maxUses: maxUses !== undefined ? maxUses : undefined,
        expiresAt:
          expiresAt !== undefined
            ? expiresAt
              ? new Date(expiresAt)
              : null
            : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROMO_CODE_UPDATED",
        resourceType: "PromoCode",
        resourceId: promoCode.id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || undefined,
        metadata: JSON.stringify({
          code: promoCode.code,
          updates: { isActive, maxUses, expiresAt, notes },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      promoCode,
    });
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json(
      {
        error: "Failed to update promo code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
