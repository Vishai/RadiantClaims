import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fillOfficialRECAPDF } from "@/lib/reca/pdf-form-filler";
import * as path from "path";

// POST /api/admin/pdf-templates/test - Generate a test PDF with the provided template and data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { testData } = body;

    // Generate sample form data for testing
    const sampleFormData = {
      part_1: {
        firstName: testData?.firstName || "TEST",
        middleName: testData?.middleName || "MIDDLE",
        lastName: testData?.lastName || "USER",
        formerNames: testData?.formerNames || [],
        ssn: testData?.ssn || "123-45-6789",
        dob: testData?.dob || "1965-01-01",
        mailingAddress: testData?.mailingAddress || "123 Test Street",
        city: testData?.city || "Phoenix",
        state: testData?.state || "AZ",
        zipCode: testData?.zipCode || "85001",
        phoneDay: testData?.phoneDay || "602-555-0100",
        phoneEvening: testData?.phoneEvening || "602-555-0101",
        email: testData?.email || "test@example.com",
        residenceAddress:
          testData?.residenceAddress || "123 Test Street, Phoenix, AZ 85001",
        tribalAffiliation: testData?.tribalAffiliation || "",
        tribalCensusNumber: testData?.tribalCensusNumber || "",
        tribalAssistance: testData?.tribalAssistance || [],
      },
      part_2: {
        firstName: testData?.claimantFirstName || "JANE",
        middleName: testData?.claimantMiddleName || "MARIE",
        lastName: testData?.claimantLastName || "DOE",
        ssn: testData?.claimantSsn || "987-65-4321",
        dob: testData?.claimantDob || "1963-07-22",
        dod: testData?.claimantDod || "",
      },
      part_3: {
        relationship: testData?.relationship || "Self",
      },
      part_8: {
        exposureOptions: testData?.exposureOptions || ["option_1a"],
        affectedAreas: testData?.affectedAreas || [
          {
            state: "Utah",
            townCity: "St. George",
            timePeriod: "1958-1961",
          },
        ],
        arizonaCounties: testData?.arizonaCounties || [],
        nevadaCounties: testData?.nevadaCounties || [
          {
            county: "Nye",
            townCity: "Tonopah",
            timePeriod: "1955-1962",
          },
        ],
      },
      part_10: {
        diseases: testData?.diseases || ["lung", "thyroid"],
      },
      part_13: {
        hasAttorney: testData?.hasAttorney || false,
        attorneyName: testData?.attorneyName || "",
        attorneyAddress: testData?.attorneyAddress || "",
        attorneyCity: testData?.attorneyCity || "",
        attorneyState: testData?.attorneyState || "",
        attorneyZip: testData?.attorneyZip || "",
        attorneyPhone: testData?.attorneyPhone || "",
        attorneyFax: testData?.attorneyFax || "",
      },
      part_16: {
        signature: testData?.signature || "TEST USER",
        signatureDate:
          testData?.signatureDate || new Date().toLocaleDateString(),
        authorizationAcknowledgment: true,
      },
    };

    // Path to the official PDF template
    const officialPdfPath = path.join(
      process.cwd(),
      "docs",
      "RECA Downwinder Claim Form.pdf"
    );

    // Generate the filled PDF
    const filledPdfBytes = await fillOfficialRECAPDF({
      formData: sampleFormData,
      supportingForms: {},
      sessionId: `test-${Date.now()}`,
      officialPdfPath,
    });

    // Return the PDF as a response
    const pdfBytes = new Uint8Array(filledPdfBytes);
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="test-pdf-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating test PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
