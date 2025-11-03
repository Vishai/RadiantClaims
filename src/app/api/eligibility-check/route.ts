import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      // Step 1: Intent
      intent,
      // Step 2: Contact Info
      firstName,
      lastName,
      email,
      phone,
      relationship,
      // Step 3: Residence
      residenceState,
      residenceDuration,
      arizonaCounty,
      nevadaCounty,
      // Step 4: Cancer
      hasCancer,
      cancerType,
      // Step 5: Latency
      latencyMet,
      // Step 6: Referral Info (if applicable)
      referrerName,
      referrerEmail,
      referrerPhone,
    } = data;

    // Calculate eligibility
    const hasResidence =
      residenceState &&
      residenceState !== "none" &&
      residenceDuration === "yes";
    const hasCoveredCancer = hasCancer === "yes";
    const meetsLatency = latencyMet === "yes" || latencyMet === "unsure";

    let eligibilityStatus: string;
    if (hasResidence && hasCoveredCancer && meetsLatency) {
      eligibilityStatus = "likely";
    } else if (hasResidence && hasCoveredCancer && latencyMet === "no") {
      eligibilityStatus = "unlikely";
    } else if (!hasResidence || !hasCoveredCancer) {
      eligibilityStatus = "ineligible";
    } else {
      eligibilityStatus = "needs-review";
    }

    // Create or update referral record if this is a referral
    let referralRecord = null;
    if (
      (intent === "someone-else" || intent === "someone-else-relative") &&
      referrerEmail
    ) {
      // Check if referrer already has a referral code
      const existingReferral = await db.referral.findFirst({
        where: { contact: referrerEmail },
      });

      if (existingReferral) {
        referralRecord = existingReferral;
      } else {
        // Generate a unique referral code
        const referralCode = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        referralRecord = await db.referral.create({
          data: {
            code: referralCode,
            referrerName: referrerName || "Unknown",
            contact: referrerEmail,
            notes: `Referral submitted via eligibility check. Phone: ${referrerPhone || "N/A"}`,
          },
        });
      }
    }

    // Create a lead/claimant record (even if eligibility is uncertain)
    // This ensures we can follow up with everyone who submits
    const claimantData: any = {
      firstName,
      lastName,
      email,
      phone,
      // We'll need to add these required fields - using defaults for now
      dob: new Date("1950-01-01"), // Placeholder - we should update schema or make optional
      address1: "TBD - From eligibility check",
      city: "TBD",
      county: arizonaCounty || nevadaCounty || "TBD",
      state: residenceState || "TBD",
      postalCode: "00000", // Placeholder
    };

    // Add referral code if this was a referral
    if (referralRecord) {
      claimantData.referralCode = referralRecord.code;
    }

    // Add cancer type if provided
    if (cancerType) {
      claimantData.cancerType = cancerType;
    }

    // Add relationship if this is a survivor claim
    if (intent === "deceased-relative" && relationship) {
      // Map relationship string to enum if needed
      claimantData.relationshipToClaimant = relationship
        .toUpperCase()
        .replace(/\s+/g, "_");
    }

    const claimant = await db.claimant.create({
      data: claimantData,
    });

    // Store the eligibility check metadata in notes or a separate table
    // For now, we'll return this data
    // TODO: Send notification emails
    // - Confirmation to the claimant/referral subject
    // - Notification to referrer if applicable
    // - Alert to admin team for follow-up

    return NextResponse.json({
      success: true,
      claimantId: claimant.id,
      eligibilityStatus,
      referralCode: referralRecord?.code,
      message:
        intent === "someone-else" || intent === "someone-else-relative"
          ? "Referral submitted successfully. We'll contact them within 1-2 business days."
          : "Thank you for submitting your eligibility check. We'll be in touch soon.",
    });
  } catch (error) {
    console.error("Error processing eligibility check:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process eligibility check. Please try again.",
      },
      { status: 500 }
    );
  }
}
