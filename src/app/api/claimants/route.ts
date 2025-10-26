import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimantSchema } from "@/lib/validations/claimant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = claimantSchema.parse(body);

    const claimant = await db.claimant.create({
      data: {
        ...validated,
        dob: new Date(validated.dob),
      },
    });

    return NextResponse.json(claimant, { status: 201 });
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
