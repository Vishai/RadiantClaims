import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimantSchema } from "@/lib/validations/claimant";
import { createCustomerAccount, sendWelcomeEmail } from "@/lib/create-customer-account";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = claimantSchema.parse(body);

    // Handle referral code - only set if provided and valid
    let referralCode: string | null = null;
    if (validated.referralCode && validated.referralCode.trim() !== "") {
      // Verify referral code exists
      const referralExists = await db.referral.findUnique({
        where: { code: validated.referralCode },
      });

      if (referralExists) {
        referralCode = validated.referralCode;
      }
      // If referral code provided but doesn't exist, just ignore it (don't throw error)
    }

    const claimant = await db.claimant.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        dob: new Date(validated.dob),
        address1: validated.address1,
        address2: validated.address2 || null,
        city: validated.city,
        county: validated.county,
        state: validated.state,
        postalCode: validated.postalCode,
        referralCode,
      },
    });

    // Create customer account automatically
    const { user, temporaryPassword } = await createCustomerAccount({
      email: validated.email,
      name: `${validated.firstName} ${validated.lastName}`,
      claimantId: claimant.id,
    });

    // Send welcome email with credentials
    // Only send if this is a new account (temporaryPassword is set)
    if (temporaryPassword) {
      await sendWelcomeEmail({
        email: validated.email,
        name: `${validated.firstName} ${validated.lastName}`,
        temporaryPassword,
        claimantId: claimant.id,
      });
    }

    return NextResponse.json(
      {
        claimant,
        accountCreated: !!temporaryPassword,
        // Include credentials in response for now (for testing)
        // TODO: Remove in production - only send via email
        ...(temporaryPassword && {
          credentials: {
            email: validated.email,
            temporaryPassword,
          },
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create claimant" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        state ? { state } : {},
      ],
    };

    const [claimants, total] = await Promise.all([
      db.claimant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          referral: true,
        },
      }),
      db.claimant.count({ where }),
    ]);

    return NextResponse.json({
      claimants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch claimants:", error);
    return NextResponse.json(
      { error: "Failed to fetch claimants" },
      { status: 500 }
    );
  }
}
