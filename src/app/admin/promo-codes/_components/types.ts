export interface PromoCode {
  id: string;
  code: string;
  type: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  freeTrialDays: number | null;
  duration: string;
  durationInMonths: number | null;
  allowedTiers: string[];
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  accessOverrideEnabled: boolean;
  accessSeatsTotal: number | null;
  accessSeatsUsed: number;
  stripeCouponId: string | null;
  notes: string | null;
  campaignName: string | null;
  useTieredDiscounts: boolean;
  createdAt: string;
  subscriptions: Array<{
    id: string;
    userId: string;
    createdAt: string;
  }>;
  tiers?: Array<{
    id: string;
    tierOrder: number;
    startAfterUses: number;
    maxUsesInTier: number | null;
    percentOff: number | null;
    amountOff: number | null;
    description: string | null;
  }>;
}

export interface Tier {
  id: string;
  tierOrder: number;
  startAfterUses: number;
  maxUsesInTier: number | null;
  percentOff: number | null;
  amountOff: number | null;
  description: string;
}

export interface CreatePromoCodeForm {
  code: string;
  type: string;
  description: string;
  percentOff: string;
  amountOff: string;
  freeTrialDays: string;
  duration: string;
  durationInMonths: string;
  allowedTiers: string[];
  maxUses: string;
  accessOverrideEnabled: boolean;
  accessSeatsTotal: string;
  expiresInDays: string;
  createStripeCoupon: boolean;
  notes: string;
  campaignName: string;
  useTieredDiscounts: boolean;
  tiers: Tier[];
}
