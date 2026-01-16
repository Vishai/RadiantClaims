import Stripe from "stripe";

// Use the LIVE key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

async function createLiveTestCoupon() {
  console.log("Creating LIVE mode coupon...");

  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "forever",
    name: "Internal Testing - 100% Off",
    id: "INTERNAL_TEST_100", // Easy to remember
  });

  console.log("✅ LIVE Coupon created!");
  console.log("Code to use in Stripe checkout:", coupon.id);
  console.log("Live mode:", coupon.livemode);
}

createLiveTestCoupon().catch((err) => {
  if (err.code === "resource_already_exists") {
    console.log(
      "✅ Coupon 'INTERNAL_TEST_100' already exists! Use it in checkout."
    );
  } else {
    console.error("Error:", err);
  }
});
