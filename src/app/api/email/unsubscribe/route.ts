import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const unsubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z
    .enum([
      "WELCOME",
      "RESUME_LINK",
      "UPLOAD_CONFIRMATION",
      "PACKET_READY",
      "MARKETING",
      "UPDATES",
      "ALL",
    ])
    .optional()
    .default("ALL"),
  token: z.string().optional(),
});

/**
 * POST /api/email/unsubscribe
 * Unsubscribe user from email notifications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = unsubscribeSchema.parse(body);

    // If unsubscribing from ALL, update all email types
    if (validated.type === "ALL") {
      const emailTypes = [
        "WELCOME",
        "RESUME_LINK",
        "UPLOAD_CONFIRMATION",
        "PACKET_READY",
        "MARKETING",
        "UPDATES",
      ];

      for (const emailType of emailTypes) {
        await db.emailPreference.upsert({
          where: {
            email_emailType: {
              email: validated.email,
              emailType: emailType as any,
            },
          },
          create: {
            email: validated.email,
            emailType: emailType as any,
            isUnsubscribed: true,
            unsubscribedAt: new Date(),
          },
          update: {
            isUnsubscribed: true,
            unsubscribedAt: new Date(),
          },
        });
      }
    } else {
      // Unsubscribe from specific email type
      await db.emailPreference.upsert({
        where: {
          email_emailType: {
            email: validated.email,
            emailType: validated.type as any,
          },
        },
        create: {
          email: validated.email,
          emailType: validated.type as any,
          isUnsubscribed: true,
          unsubscribedAt: new Date(),
        },
        update: {
          isUnsubscribed: true,
          unsubscribedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unsubscribed",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Failed to unsubscribe:", error);
    return NextResponse.json(
      {
        error: "Failed to unsubscribe",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/unsubscribe?email=xxx&type=xxx
 * Unsubscribe via GET request (for email links)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const type = searchParams.get("type") || "ALL";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validated = unsubscribeSchema.parse({ email, type });

    // Perform unsubscribe
    if (validated.type === "ALL") {
      const emailTypes = [
        "WELCOME",
        "RESUME_LINK",
        "UPLOAD_CONFIRMATION",
        "PACKET_READY",
        "MARKETING",
        "UPDATES",
      ];

      for (const emailType of emailTypes) {
        await db.emailPreference.upsert({
          where: {
            email_emailType: {
              email: validated.email,
              emailType: emailType as any,
            },
          },
          create: {
            email: validated.email,
            emailType: emailType as any,
            isUnsubscribed: true,
            unsubscribedAt: new Date(),
          },
          update: {
            isUnsubscribed: true,
            unsubscribedAt: new Date(),
          },
        });
      }
    } else {
      await db.emailPreference.upsert({
        where: {
          email_emailType: {
            email: validated.email,
            emailType: validated.type as any,
          },
        },
        create: {
          email: validated.email,
          emailType: validated.type as any,
          isUnsubscribed: true,
          unsubscribedAt: new Date(),
        },
        update: {
          isUnsubscribed: true,
          unsubscribedAt: new Date(),
        },
      });
    }

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL(
        `/unsubscribe/success?email=${encodeURIComponent(email)}`,
        req.url
      )
    );
  } catch (error) {
    console.error("Failed to unsubscribe:", error);
    return NextResponse.redirect(new URL("/unsubscribe/error", req.url));
  }
}
