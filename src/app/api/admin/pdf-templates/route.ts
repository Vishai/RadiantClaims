import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/pdf-templates - Get all PDF templates
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return mock data since we haven't added the database schema yet
    // In production, this would query from the database
    const templates = [
      {
        id: "reca-default",
        name: "RECA Downwinder Claim Form",
        description: "Official DOJ RECA claim form with all 16 parts",
        formType: "RECA",
        version: "2024-10",
        fieldMappings: getDefaultFieldMappings(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/admin/pdf-templates - Create a new PDF template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.formType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, save to database
    // For now, return the created template
    const template = {
      id: `template-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

function getDefaultFieldMappings() {
  return [
    // Part 1 - Filer Information
    {
      id: "field-1",
      fieldName: "Filer First Name",
      pdfFieldKey: "part1.firstName",
      page: 0,
      x: 80,
      y: 420,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "First name of the person filing the claim",
    },
    {
      id: "field-2",
      fieldName: "Filer Middle Name",
      pdfFieldKey: "part1.middleName",
      page: 0,
      x: 280,
      y: 420,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "Middle name of the filer",
    },
    {
      id: "field-3",
      fieldName: "Filer Last Name",
      pdfFieldKey: "part1.lastName",
      page: 0,
      x: 380,
      y: 420,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "Last name of the filer",
    },
    {
      id: "field-4",
      fieldName: "Filer SSN",
      pdfFieldKey: "part1.ssn",
      page: 0,
      x: 80,
      y: 380,
      type: "ssn",
      fontSize: 12,
      description: "Social Security Number (XXX-XX-XXXX)",
    },
    {
      id: "field-5",
      fieldName: "Filer Date of Birth",
      pdfFieldKey: "part1.dob",
      page: 0,
      x: 200,
      y: 380,
      type: "date",
      fontSize: 12,
      description: "Date of birth (MM/DD/YYYY)",
    },
    {
      id: "field-6",
      fieldName: "Mailing Address",
      pdfFieldKey: "part1.mailingAddress",
      page: 0,
      x: 80,
      y: 340,
      type: "text",
      fontSize: 12,
      maxWidth: 300,
      description: "Mailing address",
    },
    {
      id: "field-7",
      fieldName: "City",
      pdfFieldKey: "part1.city",
      page: 0,
      x: 80,
      y: 320,
      type: "text",
      fontSize: 12,
      description: "City",
    },
    {
      id: "field-8",
      fieldName: "State",
      pdfFieldKey: "part1.state",
      page: 0,
      x: 250,
      y: 320,
      type: "text",
      fontSize: 12,
      description: "State",
    },
    {
      id: "field-9",
      fieldName: "Zip Code",
      pdfFieldKey: "part1.zipCode",
      page: 0,
      x: 320,
      y: 320,
      type: "text",
      fontSize: 12,
      description: "Zip code",
    },
    // Part 2 - Claimant Information
    {
      id: "field-10",
      fieldName: "Claimant First Name",
      pdfFieldKey: "part2.firstName",
      page: 1,
      x: 80,
      y: 600,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "Claimant's first name",
    },
    {
      id: "field-11",
      fieldName: "Claimant Last Name",
      pdfFieldKey: "part2.lastName",
      page: 1,
      x: 380,
      y: 600,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "Claimant's last name",
    },
    // Part 8 - Exposure Locations (Critical)
    {
      id: "field-12",
      fieldName: "Exposure Option 1a",
      pdfFieldKey: "part8.option1a",
      page: 6,
      x: 42,
      y: 600,
      type: "checkbox",
      description: "Designated area for 1+ year (1951-1962)",
    },
    {
      id: "field-13",
      fieldName: "Nevada Nye County Town",
      pdfFieldKey: "part8.nevada.nye.townCity",
      page: 6,
      x: 280,
      y: 340,
      type: "text",
      fontSize: 10,
      description: "Town/City in Nye County, Nevada",
    },
    // Part 10 - Diseases (Critical)
    {
      id: "field-14",
      fieldName: "Leukemia",
      pdfFieldKey: "part10.leukemia",
      page: 8,
      x: 42,
      y: 520,
      type: "checkbox",
      description: "Leukemia (except chronic lymphocytic)",
    },
    {
      id: "field-15",
      fieldName: "Lung Cancer",
      pdfFieldKey: "part10.lung",
      page: 8,
      x: 42,
      y: 500,
      type: "checkbox",
      description: "Primary lung cancer",
    },
    {
      id: "field-16",
      fieldName: "Thyroid Cancer",
      pdfFieldKey: "part10.thyroid",
      page: 8,
      x: 42,
      y: 480,
      type: "checkbox",
      description: "Thyroid cancer",
    },
    // Part 13 - Attorney Information
    {
      id: "field-17",
      fieldName: "Has Attorney",
      pdfFieldKey: "part13.hasAttorney",
      page: 10,
      x: 42,
      y: 400,
      type: "checkbox",
      description: "Is represented by attorney",
    },
    {
      id: "field-18",
      fieldName: "Attorney Name",
      pdfFieldKey: "part13.attorneyName",
      page: 10,
      x: 80,
      y: 360,
      type: "text",
      fontSize: 12,
      characterSpacing: 18,
      description: "Attorney's full name",
    },
    // Part 16 - Signature (Critical)
    {
      id: "field-19",
      fieldName: "Signature Date",
      pdfFieldKey: "part16.signatureDate",
      page: 12,
      x: 450,
      y: 200,
      type: "date",
      fontSize: 12,
      description: "Date of signature",
    },
  ];
}
