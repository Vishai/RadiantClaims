import { PromoCode } from "./types";

export const getTypeColor = (type: string) => {
  switch (type) {
    case "PERCENT_OFF":
      return "bg-blue-100 text-blue-800";
    case "AMOUNT_OFF":
      return "bg-green-100 text-green-800";
    case "PILOT_ACCOUNT":
      return "bg-purple-100 text-purple-800";
    case "WAIVE_SETUP":
      return "bg-yellow-100 text-yellow-800";
    case "FREE_TRIAL":
      return "bg-pink-100 text-pink-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case "PERCENT_OFF":
      return "Percent Off";
    case "AMOUNT_OFF":
      return "Amount Off";
    case "PILOT_ACCOUNT":
      return "Pilot Account";
    case "WAIVE_SETUP":
      return "Waive Setup";
    case "FREE_TRIAL":
      return "Free Trial";
    default:
      return type;
  }
};

export const getDiscountValue = (promoCode: PromoCode) => {
  let value = "";

  if (promoCode.percentOff) value = `${promoCode.percentOff}% off`;
  else if (promoCode.amountOff)
    value = `$${promoCode.amountOff.toFixed(2)} off`;
  else if (promoCode.freeTrialDays) value = `${promoCode.freeTrialDays} days`;
  else if (promoCode.type === "PILOT_ACCOUNT") value = "100% off";
  else if (promoCode.type === "WAIVE_SETUP") return "Setup fee waived";
  else value = "-";

  // Add duration info
  if (promoCode.duration === "REPEATING" && promoCode.durationInMonths) {
    value += ` (${promoCode.durationInMonths} mo)`;
  } else if (promoCode.duration === "FOREVER") {
    value += " (lifetime)";
  } else if (promoCode.duration === "ONCE") {
    value += " (once)";
  }

  return value;
};
