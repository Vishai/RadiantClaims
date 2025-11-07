import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = params;

    // Get session with all files
    const intakeSession = await prisma.intakeSession.findUnique({
      where: { id: sessionId },
      include: {
        claimant: true,
        uploadedFiles: {
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!intakeSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Add a README with session info
    const readmeContent = `
Claim Packet for ${intakeSession.claimant?.firstName} ${intakeSession.claimant?.lastName}
Session ID: ${intakeSession.id}
Status: ${intakeSession.status}
Claim Type: ${intakeSession.claimType || "Not specified"}
Created: ${intakeSession.createdAt.toLocaleDateString()}
Total Files: ${intakeSession.uploadedFiles.length}

Files included in this packet:
${intakeSession.uploadedFiles
  .map(
    (f, i) =>
      `${i + 1}. ${f.originalFilename} (${f.category || "Uncategorized"})`
  )
  .join("\n")}
    `.trim();

    zip.file("README.txt", readmeContent);

    // Add each file to the ZIP
    for (const file of intakeSession.uploadedFiles) {
      try {
        // Fetch file from storage
        const fileResponse = await fetch(file.fileUrl);
        if (fileResponse.ok) {
          const fileBuffer = await fileResponse.arrayBuffer();
          const folder = file.category ? `${file.category}/` : "";
          zip.file(`${folder}${file.originalFilename}`, fileBuffer);
        }
      } catch (error) {
        console.error(`Failed to add file ${file.originalFilename}:`, error);
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Create filename
    const claimantName = intakeSession.claimant
      ? `${intakeSession.claimant.firstName}_${intakeSession.claimant.lastName}`
      : "Unknown";
    const filename = `${claimantName}_Claim_Packet_${new Date().toISOString().split("T")[0]}.zip`;

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating packet download:", error);
    return NextResponse.json(
      { error: "Failed to generate download" },
      { status: 500 }
    );
  }
}
