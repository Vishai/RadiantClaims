import { PromoCode, PromoCodeTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type DiscountType = "PERCENT" | "AMOUNT" | "NONE";

export interface TieredDiscountResult {
  tier: PromoCodeTier | null;
  stripeCouponId: string | null;
  discountApplied: number;
  discountType: DiscountType;
}

export interface RecordPromoCodeUsageArgs {
  promoCodeId: string;
  tierId?: string | null;
  subscriptionId: string;
  userId: string;
  discountApplied: number;
  discountType: DiscountType;
  ipAddress?: string;
  userAgent?: string;
}

const ZERO_DISCOUNT: TieredDiscountResult = {
  tier: null,
  stripeCouponId: null,
  discountApplied: 0,
  discountType: "NONE",
};

/**
 * Determine which tier should apply for the next usage and ensure we have
 * a Stripe coupon for it so the discount can be applied at checkout.
 */
export async function applyTieredDiscount(
  promoCodeId: string,
  baseAmount: number
): Promise<TieredDiscountResult> {
  const promoCode = await prisma.promoCode.findUnique({
    where: { id: promoCodeId },
    include: {
      tiers: {
        orderBy: { tierOrder: "asc" },
      },
    },
  });

  if (
    !promoCode ||
    !promoCode.useTieredDiscounts ||
    promoCode.tiers.length === 0
  ) {
    return ZERO_DISCOUNT;
  }

  const nextUsageNumber = promoCode.currentUses + 1;
  const tier = determineTierForUsage(promoCode.tiers, nextUsageNumber);

  if (!tier) {
    return ZERO_DISCOUNT;
  }

  const { discountApplied, discountType } = calculateTierDiscount(
    tier,
    baseAmount
  );

  if (discountType === "NONE" || discountApplied <= 0) {
    return {
      tier,
      stripeCouponId: null,
      discountApplied: 0,
      discountType: "NONE",
    };
  }

  const stripeCouponId = await ensureTierStripeCoupon(
    promoCode,
    tier,
    discountType
  );

  return {
    tier: stripeCouponId ? { ...tier, stripeCouponId } : tier,
    stripeCouponId,
    discountApplied,
    discountType,
  };
}

/**
 * Persist detailed promo code usage analytics.
 */
export async function recordPromoCodeUsage({
  promoCodeId,
  tierId = null,
  subscriptionId,
  userId,
  discountApplied,
  discountType,
  ipAddress,
  userAgent,
}: RecordPromoCodeUsageArgs) {
  return prisma.promoCodeUsage.create({
    data: {
      promoCodeId,
      tierId,
      serviceSubscriptionId: subscriptionId,
      userId,
      discountApplied,
      discountType,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    },
  });
}

function determineTierForUsage(
  tiers: PromoCodeTier[],
  usageNumber: number
): PromoCodeTier | null {
  const normalizedUsage = Math.max(usageNumber, 1);

  for (const tier of tiers) {
    const tierStart = tier.startAfterUses + 1;
    const tierEnd = tier.maxUsesInTier
      ? tier.startAfterUses + tier.maxUsesInTier
      : Number.POSITIVE_INFINITY;

    if (normalizedUsage >= tierStart && normalizedUsage <= tierEnd) {
      return tier;
    }
  }

  return null;
}

function calculateTierDiscount(
  tier: PromoCodeTier,
  baseAmount: number
): Pick<TieredDiscountResult, "discountApplied" | "discountType"> {
  const normalizedBase = Math.max(baseAmount, 0);

  if (tier.percentOff && tier.percentOff > 0) {
    const rawDiscount = (normalizedBase * tier.percentOff) / 100;
    return {
      discountApplied: clampCurrency(rawDiscount, normalizedBase),
      discountType: "PERCENT",
    };
  }

  if (tier.amountOff && tier.amountOff > 0) {
    return {
      discountApplied: clampCurrency(tier.amountOff, normalizedBase),
      discountType: "AMOUNT",
    };
  }

  return {
    discountApplied: 0,
    discountType: "NONE",
  };
}

function clampCurrency(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const clamped = Math.min(value, max);
  return Number(clamped.toFixed(2));
}

async function ensureTierStripeCoupon(
  promoCode: PromoCode,
  tier: PromoCodeTier,
  discountType: DiscountType
): Promise<string | null> {
  if (tier.stripeCouponId) {
    return tier.stripeCouponId;
  }

  if (discountType === "NONE") {
    return null;
  }

  const duration = toStripeDuration(promoCode);

  const coupon = await stripe.coupons.create({
    percent_off:
      discountType === "PERCENT" ? (tier.percentOff ?? undefined) : undefined,
    amount_off:
      discountType === "AMOUNT"
        ? Math.round((tier.amountOff ?? 0) * 100)
        : undefined,
    currency: discountType === "AMOUNT" ? "usd" : undefined,
    duration: duration.duration,
    ...(duration.duration === "repeating"
      ? { duration_in_months: duration.durationInMonths }
      : {}),
    name: `${promoCode.code} - Tier ${tier.tierOrder}`,
    metadata: {
      promoCodeId: promoCode.id,
      promoCodeCode: promoCode.code,
      tierId: tier.id,
      tierOrder: String(tier.tierOrder),
    },
  });

  await prisma.promoCodeTier.update({
    where: { id: tier.id },
    data: { stripeCouponId: coupon.id },
  });

  return coupon.id;
}

function toStripeDuration(promoCode: PromoCode): {
  duration: "once" | "repeating" | "forever";
  durationInMonths?: number;
} {
  if (promoCode.duration === "REPEATING") {
    return {
      duration: "repeating",
      durationInMonths: promoCode.durationInMonths || 12,
    };
  }

  if (promoCode.duration === "FOREVER") {
    return { duration: "forever" };
  }

  return { duration: "once" };
}
