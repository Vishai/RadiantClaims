import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "fs/promises";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_BUCKET = process.env.R2_BUCKET!;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET) {
  console.error("❌ Missing R2 credentials. Please check your .env file.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

interface FormFile {
  fileName: string;
  r2Key: string;
}

const forms: FormFile[] = [
  {
    fileName: "RECA Downwinder Claim Form.pdf",
    r2Key: "forms/RECA-Downwinder-Claim-Form.pdf",
  },
  {
    fileName: "RECA Uranium Worker Claim Form.pdf",
    r2Key: "forms/RECA-Uranium-Worker-Claim-Form.pdf",
  },
  {
    fileName: "RECA Manhattan Project Waste Claim Form.pdf",
    r2Key: "forms/RECA-Manhattan-Project-Waste-Claim-Form.pdf",
  },
  {
    fileName: "RECA Claim Form.pdf",
    r2Key: "forms/RECA-Claim-Form.pdf",
  },
];

async function uploadFormToR2(form: FormFile) {
  console.log(`📤 Uploading ${form.fileName}...`);

  try {
    // Read the PDF file
    const filePath = join(process.cwd(), "docs", form.fileName);
    const fileBuffer = await readFile(filePath);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: form.r2Key,
      Body: fileBuffer,
      ContentType: "application/pdf",
      CacheControl: "public, max-age=31536000", // Cache for 1 year (forms rarely change)
      Metadata: {
        "original-filename": form.fileName,
        "upload-date": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    console.log(`✅ Uploaded: ${form.r2Key}`);
    return { success: true, key: form.r2Key };
  } catch (error) {
    console.error(`❌ Failed to upload ${form.fileName}:`, error);
    return { success: false, error };
  }
}

async function main() {
  console.log("🚀 Starting RECA forms upload to Cloudflare R2...\n");
  console.log(`📦 Bucket: ${R2_BUCKET}`);
  console.log(`🔗 Endpoint: ${R2_ENDPOINT}\n`);

  const results = [];

  for (const form of forms) {
    const result = await uploadFormToR2(form);
    results.push(result);
  }

  console.log("\n📊 Upload Summary:");
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n⚠️  Some uploads failed. Please check the errors above.");
    process.exit(1);
  }

  console.log("\n🎉 All RECA forms uploaded successfully to R2!");
  console.log(
    "\n💡 Next steps:"
  );
  console.log("   1. Update the seed script to use R2 keys");
  console.log("   2. Update the download API to fetch from R2");
  console.log("   3. Re-run the seed script to update database records");
}

main().catch((error) => {
  console.error("❌ Upload script failed:", error);
  process.exit(1);
});
