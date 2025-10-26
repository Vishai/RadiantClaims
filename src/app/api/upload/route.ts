import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrl, generateFileKey } from "@/lib/r2";
import { z } from "zod";

const uploadRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
});

/**
 * TODO: This is a placeholder implementation that returns mock presigned URLs
 * Once R2 is configured with real credentials, this will return actual presigned URLs
 *
 * To enable real R2 uploads:
 * 1. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET in .env
 * 2. The getPresignedPutUrl function in lib/r2.ts will automatically use real credentials
 * 3. Client should PUT file to the returned putUrl
 * 4. After upload, persist the fileKey to the Document table via /api/documents
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, contentType } = uploadRequestSchema.parse(body);

    const fileKey = generateFileKey(fileName);
    const { putUrl } = await getPresignedPutUrl(fileKey, contentType);

    return NextResponse.json({
      putUrl,
      fileKey,
      message: "Use PUT method to upload file to putUrl",
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
