/**
 * Conversion Funnel Analytics API
 *
 * Provides insights into where leads are dropping off in the conversion funnel.
 * Use this data to optimize conversion rates and identify bottlenecks.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Calculate date threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    // Get counts for each stage of the funnel
    const [
      eligibilityCompleted,
      accountCreated,
      formStarted,
      formInProgress,
      paymentPending,
      paymentCompleted,
      formCompleted,
      pdfGenerated,
      pdfDownloaded,
      submittedToDOJ,
    ] = await Promise.all([
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "ELIGIBILITY_COMPLETED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "ACCOUNT_CREATED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "FORM_STARTED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "FORM_IN_PROGRESS",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "PAYMENT_PENDING",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "PAYMENT_COMPLETED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "FORM_COMPLETED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "PDF_GENERATED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "PDF_DOWNLOADED",
        },
      }),
      db.claimant.count({
        where: {
          createdAt: { gte: thresholdDate },
          conversionStage: "SUBMITTED_TO_DOJ",
        },
      }),
    ]);

    // Calculate total at each stage (cumulative - anyone at this stage or beyond)
    const totalEligibility = eligibilityCompleted;
    const totalAccountCreated =
      accountCreated +
      formStarted +
      formInProgress +
      paymentPending +
      paymentCompleted +
      formCompleted +
      pdfGenerated +
      pdfDownloaded +
      submittedToDOJ;
    const totalFormStarted =
      formStarted +
      formInProgress +
      paymentPending +
      paymentCompleted +
      formCompleted +
      pdfGenerated +
      pdfDownloaded +
      submittedToDOJ;
    const totalPaymentCompleted =
      paymentCompleted +
      formCompleted +
      pdfGenerated +
      pdfDownloaded +
      submittedToDOJ;
    const totalFormCompleted =
      formCompleted + pdfGenerated + pdfDownloaded + submittedToDOJ;
    const totalPdfDownloaded = pdfDownloaded + submittedToDOJ;
    const totalSubmitted = submittedToDOJ;

    // Calculate conversion rates
    const total =
      totalEligibility +
      totalAccountCreated +
      totalFormStarted +
      paymentCompleted +
      formCompleted +
      pdfGenerated +
      pdfDownloaded +
      submittedToDOJ;

    const funnel = [
      {
        stage: "Eligibility Completed",
        count: totalEligibility,
        percentage: 100,
        dropOffToNext: totalEligibility - totalAccountCreated,
        conversionRate: total > 0 ? (totalEligibility / total) * 100 : 0,
      },
      {
        stage: "Account Created",
        count: totalAccountCreated,
        percentage:
          totalEligibility > 0
            ? (totalAccountCreated / totalEligibility) * 100
            : 0,
        dropOffToNext: totalAccountCreated - totalFormStarted,
        conversionRate:
          totalEligibility > 0
            ? (totalAccountCreated / totalEligibility) * 100
            : 0,
      },
      {
        stage: "Form Started",
        count: totalFormStarted,
        percentage:
          totalEligibility > 0
            ? (totalFormStarted / totalEligibility) * 100
            : 0,
        dropOffToNext: totalFormStarted - totalPaymentCompleted,
        conversionRate:
          totalEligibility > 0
            ? (totalFormStarted / totalEligibility) * 100
            : 0,
      },
      {
        stage: "Payment Completed",
        count: totalPaymentCompleted,
        percentage:
          totalEligibility > 0
            ? (totalPaymentCompleted / totalEligibility) * 100
            : 0,
        dropOffToNext: totalPaymentCompleted - totalFormCompleted,
        conversionRate:
          totalEligibility > 0
            ? (totalPaymentCompleted / totalEligibility) * 100
            : 0,
      },
      {
        stage: "Form Completed",
        count: totalFormCompleted,
        percentage:
          totalEligibility > 0
            ? (totalFormCompleted / totalEligibility) * 100
            : 0,
        dropOffToNext: totalFormCompleted - totalPdfDownloaded,
        conversionRate:
          totalEligibility > 0
            ? (totalFormCompleted / totalEligibility) * 100
            : 0,
      },
      {
        stage: "PDF Downloaded",
        count: totalPdfDownloaded,
        percentage:
          totalEligibility > 0
            ? (totalPdfDownloaded / totalEligibility) * 100
            : 0,
        dropOffToNext: totalPdfDownloaded - totalSubmitted,
        conversionRate:
          totalEligibility > 0
            ? (totalPdfDownloaded / totalEligibility) * 100
            : 0,
      },
      {
        stage: "Submitted to DOJ",
        count: totalSubmitted,
        percentage:
          totalEligibility > 0 ? (totalSubmitted / totalEligibility) * 100 : 0,
        dropOffToNext: 0,
        conversionRate:
          totalEligibility > 0 ? (totalSubmitted / totalEligibility) * 100 : 0,
      },
    ];

    // Find biggest drop-off points
    const dropOffs = funnel
      .filter((stage) => stage.dropOffToNext > 0)
      .sort((a, b) => b.dropOffToNext - a.dropOffToNext)
      .slice(0, 3);

    // Lead status breakdown
    const leadStatusCounts = await db.claimant.groupBy({
      by: ["leadStatus"],
      where: { createdAt: { gte: thresholdDate } },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      days,
      funnel,
      insights: {
        biggestDropOffs: dropOffs,
        overallConversionRate:
          totalEligibility > 0
            ? ((totalSubmitted / totalEligibility) * 100).toFixed(2) + "%"
            : "0%",
        eligibilityToPayment:
          totalEligibility > 0
            ? ((totalPaymentCompleted / totalEligibility) * 100).toFixed(2) +
              "%"
            : "0%",
        paymentToCompletion:
          totalPaymentCompleted > 0
            ? ((totalSubmitted / totalPaymentCompleted) * 100).toFixed(2) + "%"
            : "0%",
      },
      leadStatusBreakdown: leadStatusCounts.reduce(
        (acc, curr) => {
          acc[curr.leadStatus] = curr._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (error) {
    console.error("Error generating funnel analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate funnel analytics" },
      { status: 500 }
    );
  }
}
