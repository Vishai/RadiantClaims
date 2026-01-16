import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

async function createTestCoupon() {
  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: "forever",
    name: "Testing Coupon - 100% Off",
    id: "TEST100", // Easy to remember
  });

  console.log("✅ Coupon created!");
  console.log("Code to use in Stripe checkout:", coupon.id);
  console.log("\nFull details:", coupon);
}

createTestCoupon().catch((err) => {
  if (err.code === "resource_already_exists") {
    console.log("✅ Coupon 'TEST100' already exists! Use it in checkout.");
  } else {
    console.error("Error:", err);
  }
});
