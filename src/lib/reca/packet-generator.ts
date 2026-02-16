import JSZip from "jszip";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { uploadToR2, getObject } from "@/lib/r2";
import { fillOfficialRECAPDF } from "./pdf-form-filler";
import { generateRECAPDF } from "./pdf-generator";
import type { RECAFormData, RECASupportingForms } from "./types";
import type { PacketStatus } from "@prisma/client";

interface GeneratePacketOptions {
  sessionId: string;
  initiatedByUserId?: string | null;
  forceRegenerate?: boolean;
}

interface PacketManifest {
  version: number;
  generatedAt: string;
  sessionId: string;
  claimType: string | null;
  claimant?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  files: Array<{
    id: string;
    filename: string;
    category: string | null;
    sizeBytes: number;
    uploadedAt: string;
  }>;
  warnings: string[];
}

const OFFICIAL_FORM_PATH = path.join(
  process.cwd(),
  "public",
  "forms",
  "reca-downwinder-claim-form.pdf"
);

function buildArchiveKey(sessionId: string, version: number) {
  const timestamp = Date.now();
  return `packets/${sessionId}/packet-v${version}-${timestamp}.zip`;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function determineStatusFromWarnings(warnings: string[]): PacketStatus {
  if (warnings.length === 0) {
    return "READY";
  }
  return "PENDING";
}

export async function generatePacketArchive({
  sessionId,
  initiatedByUserId,
  forceRegenerate = false,
}: GeneratePacketOptions) {
  const intakeSession = await db.intakeSession.findUnique({
    where: { id: sessionId },
    include: {
      claimant: true,
      uploadedFiles: {
        where: { status: "READY" },
        orderBy: { uploadedAt: "asc" },
      },
      packetSubmission: true,
    },
  });

  if (!intakeSession) {
    throw new Error("Intake session not found");
  }

  const warnings: string[] = [];
  if (intakeSession.uploadedFiles.length === 0) {
    warnings.push(
      "No supporting documents were included. DOJ may return your claim as incomplete."
    );
  }

  if (!intakeSession.recaFormData) {
    warnings.push(
      "RECA form responses are incomplete. Please finish the form before mailing."
    );
  }

  // Initialize packet submission record if needed
  let packetSubmission = intakeSession.packetSubmission;
  if (!packetSubmission) {
    packetSubmission = await db.packetSubmission.create({
      data: {
        intakeSessionId: intakeSession.id,
        status: "GENERATING",
      },
    });
  } else if (!forceRegenerate && packetSubmission.status === "READY") {
    // If we already have a ready packet and no force flag, skip regeneration
    // Callers can set forceRegenerate to true to rebuild
  }

  const version = (packetSubmission.version ?? 0) + 1;

  const zip = new JSZip();

  // README / summary
  zip.file(
    "README.txt",
    [
      "RadiantClaims - DOJ Packet Export",
      `Claim ID: ${intakeSession.claimant?.id ?? intakeSession.id}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      "How to file:",
      "- Recommended: file online via https://reca.justice.gov/ (upload scans)",
      "- Alternate: file by mail (DOJ address listed on justice.gov/civil/reca)",
      "",
      "Note on originals/certified copies:",
      "- If you file online, DOJ allows you to upload scans of original/certified documents.",
      "- DOJ may request originals/certified copies later to validate authenticity.",
      "",
      "Contents:",
      "- forms/RECA-Downwinder-<sessionId>.pdf (pre-filled)",
      "- forms/RadiantClaims-Summary-<sessionId>.pdf",
      "- documents/<category>/<filename> (supporting evidence)",
      "- manifest.json (metadata)",
      "",
      "Warnings:",
      warnings.length === 0 ? "None" : warnings.map((w) => `- ${w}`).join("\n"),
    ].join("\n")
  );

  const formData =
    (intakeSession.recaFormData as Partial<RECAFormData> | null) ?? {};
  const supportingForms =
    (intakeSession.recaSupportingForms as Partial<RECASupportingForms> | null) ??
    {};

  // Generate official DOJ form PDF
  const officialFormBytes = await fillOfficialRECAPDF({
    formData,
    supportingForms,
    sessionId: intakeSession.id,
    officialPdfPath: OFFICIAL_FORM_PATH,
  });

  zip
    .folder("forms")
    ?.file(
      `RECA-Downwinder-${sanitizeFileName(intakeSession.id)}.pdf`,
      Buffer.from(officialFormBytes)
    );

  // Generate Radiant summary PDF
  const summaryBytes = await generateRECAPDF({
    formData,
    supportingForms,
    sessionId: intakeSession.id,
  });

  zip
    .folder("forms")
    ?.file(
      `RadiantClaims-Summary-${sanitizeFileName(intakeSession.id)}.pdf`,
      Buffer.from(summaryBytes)
    );

  const manifestFiles: PacketManifest["files"] = [];
  const documentsFolder = zip.folder("documents");

  for (const file of intakeSession.uploadedFiles) {
    const fileBuffer = file.fileKey ? await getObject(file.fileKey) : null;
    if (!fileBuffer) {
      warnings.push(
        `File "${file.originalFilename}" could not be retrieved from storage.`
      );
      continue;
    }

    const folderName = sanitizeFileName(file.category ?? "uncategorized");
    documentsFolder
      ?.folder(folderName)
      ?.file(
        sanitizeFileName(file.originalFilename || `${file.id}.pdf`),
        fileBuffer
      );

    manifestFiles.push({
      id: file.id,
      filename: file.originalFilename || file.id,
      category: file.category,
      sizeBytes: file.sizeBytes,
      uploadedAt: file.uploadedAt.toISOString(),
    });
  }

  const manifest: PacketManifest = {
    version,
    generatedAt: new Date().toISOString(),
    sessionId: intakeSession.id,
    claimType: intakeSession.claimType ?? null,
    claimant: intakeSession.claimant
      ? {
          id: intakeSession.claimant.id,
          name:
            `${intakeSession.claimant.firstName ?? ""} ${intakeSession.claimant.lastName ?? ""}`.trim() ||
            null,
          email: intakeSession.claimant.email ?? null,
        }
      : undefined,
    files: manifestFiles,
    warnings,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const archiveBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const archiveChecksum = crypto
    .createHash("sha256")
    .update(archiveBuffer)
    .digest("hex");

  const archiveKey = buildArchiveKey(sessionId, version);
  const { key: storedKey } = await uploadToR2(
    archiveKey,
    archiveBuffer,
    "application/zip"
  );

  const status = determineStatusFromWarnings(warnings);
  const readyAt = status === "READY" ? new Date() : null;

  const updatedSubmission = await db.packetSubmission.update({
    where: { id: packetSubmission.id },
    data: {
      packetFileKey: storedKey,
      status,
      fileCount: manifestFiles.length,
      totalSizeBytes: manifestFiles.reduce(
        (sum, file) => sum + file.sizeBytes,
        0
      ),
      generatedAt: new Date(),
      readyAt,
      archiveKey: storedKey,
      archiveFileName: `radiantclaims-packet-v${version}.zip`,
      archiveSizeBytes: archiveBuffer.length,
      archiveChecksum,
      version,
      warnings,
    },
  });

  await db.packetGeneration.create({
    data: {
      packetSubmissionId: updatedSubmission.id,
      version,
      status,
      archiveKey: storedKey,
      archiveSizeBytes: archiveBuffer.length,
      warnings,
      generatedBy: initiatedByUserId ?? null,
    },
  });

  return {
    status,
    archiveKey: storedKey,
    archiveSizeBytes: archiveBuffer.length,
    checksum: archiveChecksum,
    version,
    warnings,
    readyAt,
  };
}
