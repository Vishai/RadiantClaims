import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env.mjs";

// TODO: Wire up real R2/S3 credentials
// This is a placeholder implementation that returns mock URLs
// Once you have R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, and R2_BUCKET set,
// uncomment the real implementation below

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto", // R2 uses 'auto' for region
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string
): Promise<{ putUrl: string; fileKey: string }> {
  const client = getS3Client();

  // TODO: Remove this mock implementation once R2 is configured
  if (!client || !env.R2_BUCKET) {
    console.warn(
      "R2 credentials not configured. Returning mock presigned URL."
    );
    return {
      putUrl: `https://mock-r2-endpoint.example.com/${key}?signature=mock`,
      fileKey: key,
    };
  }

  // Real R2 implementation
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const putUrl = await getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour

  return {
    putUrl,
    fileKey: key,
  };
}

export function generateFileKey(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${timestamp}-${randomString}-${sanitizedFileName}`;
}

export const R2_PUBLIC_URL = env.R2_ENDPOINT
  ? `${env.R2_ENDPOINT}/${env.R2_BUCKET}`
  : "https://mock-r2-endpoint.example.com";

/**
 * Download a file from Vercel Blob storage or R2
 * @param fileKeyOrUrl - Either an R2 key or a full Vercel Blob URL
 */
export async function getObject(fileKeyOrUrl: string): Promise<Buffer | null> {
  try {
    // If it's a full URL (Vercel Blob), fetch directly
    if (fileKeyOrUrl.startsWith("http")) {
      const response = await fetch(fileKeyOrUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file: ${response.statusText}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Otherwise, treat as R2 key (not implemented yet)
    console.warn("R2 getObject not yet implemented for keys");
    return null;
  } catch (error) {
    console.error("Failed to download file:", error);
    return null;
  }
}
