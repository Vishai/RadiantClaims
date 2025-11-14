import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RECAFormType } from "@prisma/client";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env.mjs";

export const dynamic = "force-dynamic";

// Initialize S3 client for R2
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

/**
 * GET /api/forms/download/[formType]
 * Downloads PDF file from R2 storage
 * Example: GET /api/forms/download/downwinder
 */
export async function GET(
  _request: Request,
  { params }: { params: { formType: string } }
) {
  try {
    const { formType } = params;

    // Convert URL param to enum value
    const formTypeEnum = formType
      .toUpperCase()
      .replace(/-/g, "_") as RECAFormType;

    // Validate form type
    if (!Object.values(RECAFormType).includes(formTypeEnum)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid form type",
        },
        { status: 400 }
      );
    }

    // Get form metadata from database
    const form = await db.rECAForm.findFirst({
      where: {
        formType: formTypeEnum,
      },
    });

    if (!form) {
      return NextResponse.json(
        {
          success: false,
          error: "Form not found",
        },
        { status: 404 }
      );
    }

    // Get file from R2
    const client = getS3Client();

    if (!client || !env.R2_BUCKET) {
      return NextResponse.json(
        {
          success: false,
          error: "Storage not configured",
        },
        { status: 500 }
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: form.fileKey,
      });

      const response = await client.send(command);

      if (!response.Body) {
        throw new Error("No file body in response");
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      // @ts-ignore - Body is a readable stream
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      // Return PDF with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${form.fileName}"`,
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year (forms rarely change)
        },
      });
    } catch (r2Error) {
      console.error("Error fetching from R2:", r2Error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch form from storage",
          fileName: form.fileName,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error downloading RECA form:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download RECA form",
      },
      { status: 500 }
    );
  }
}
