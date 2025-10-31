import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env.mjs";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_ENDPOINT) {
    console.warn("R2 credentials not configured");
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

/**
 * Upload a file to R2
 * @param key - The file key/path in R2
 * @param file - The file to upload (File or Buffer)
 * @param contentType - MIME type of the file
 * @returns The URL to access the file
 */
export async function uploadToR2(
  key: string,
  file: File | Buffer,
  contentType: string
): Promise<{ url: string; key: string }> {
  const client = getS3Client();

  if (!client || !env.R2_BUCKET) {
    throw new Error("R2 is not configured. Check your environment variables.");
  }

  // Convert File to Buffer if needed
  let buffer: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Construct the public URL
  // R2 public URL format: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
  const publicUrl = `${env.R2_ENDPOINT}/${key}`;

  return {
    url: publicUrl,
    key: key,
  };
}

/**
 * Delete a file from R2
 * @param key - The file key to delete
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getS3Client();

  if (!client || !env.R2_BUCKET) {
    console.warn("R2 not configured, skipping delete");
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get a presigned URL for uploading (for client-side uploads)
 * @param key - The file key
 * @param contentType - MIME type
 */
export async function getPresignedPutUrl(
  key: string,
  contentType: string
): Promise<{ putUrl: string; fileKey: string }> {
  const client = getS3Client();

  if (!client || !env.R2_BUCKET) {
    throw new Error("R2 is not configured. Check your environment variables.");
  }

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

/**
 * Generate a unique file key for R2
 */
export function generateFileKey(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `uploads/${timestamp}-${randomString}-${sanitizedFileName}`;
}

/**
 * Get an object from R2 (download)
 * @param fileKeyOrUrl - Either an R2 key or a full URL
 */
export async function getObject(fileKeyOrUrl: string): Promise<Buffer | null> {
  try {
    // If it's a full URL, fetch directly
    if (fileKeyOrUrl.startsWith("http")) {
      const response = await fetch(fileKeyOrUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file: ${response.statusText}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    // Otherwise, treat as R2 key
    const client = getS3Client();
    if (!client || !env.R2_BUCKET) {
      console.error("R2 not configured");
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: fileKeyOrUrl,
    });

    const response = await client.send(command);
    const stream = response.Body;

    if (!stream) {
      console.error("No body in R2 response");
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Failed to download file:", error);
    return null;
  }
}

export const R2_PUBLIC_URL =
  env.R2_ENDPOINT || "https://mock-r2-endpoint.example.com";
