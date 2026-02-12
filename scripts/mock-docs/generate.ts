import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Row = Record<string, string>;

type Persona = {
  id: string;
  name: string;
  relationship: string; // P3
  filingForSelf: boolean;
  firstName: string;
  lastName: string;
  dob: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  hasNameChanges: boolean;
  numberOfMarriages: number;
  diseases: string[];
  proofDesc: string;
  exposure: string;
  claimantFirstName?: string;
  claimantLastName?: string;
  claimantDob?: string;
  claimantSsn?: string;
  claimantDod?: string;
  claimantDeceased?: string;
};

function bool(v: string | undefined): boolean {
  return (
    (v || "").trim().toLowerCase() === "true" || (v || "").trim() === "YES"
  );
}

function safeName(s: string) {
  return s
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function parseJson<T>(s: string | undefined, fallback: T): T {
  try {
    if (!s || !s.trim()) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

async function makePdf(
  outPath: string,
  opts: {
    title: string;
    subtitle?: string;
    lines: Array<[string, string]>;
    style: "realish" | "fake";
  }
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Header
  const titleY = 740;
  page.drawText(opts.title, {
    x: 50,
    y: titleY,
    size: 20,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  if (opts.subtitle) {
    page.drawText(opts.subtitle, {
      x: 50,
      y: titleY - 24,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  // "Real-ish" styling: simple border + faux seal
  if (opts.style === "realish") {
    page.drawRectangle({
      x: 40,
      y: 60,
      width: 532,
      height: 680,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
    });
    page.drawCircle({
      x: 520,
      y: 730,
      size: 18,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText("SEAL", {
      x: 507,
      y: 724,
      size: 8,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  // "Fake" styling: watermark
  if (opts.style === "fake") {
    page.drawText("SAMPLE DOCUMENT", {
      x: 80,
      y: 390,
      size: 48,
      font: bold,
      color: rgb(0.9, 0.2, 0.2),
      rotate: { type: "degrees", angle: 25 },
      opacity: 0.12,
    } as any);
  }

  // Body
  let y = 670;
  for (const [k, v] of opts.lines) {
    page.drawText(k, {
      x: 60,
      y,
      size: 10,
      font: bold,
      color: rgb(0.15, 0.15, 0.15),
    });
    page.drawText(String(v ?? ""), {
      x: 220,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 18;
    if (y < 90) break;
  }

  // Footer
  page.drawText("For testing only. Not a real government record.", {
    x: 50,
    y: 40,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const bytes = await pdf.save();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, bytes);
}

function requiredDocs(p: Persona) {
  // Minimal set for our app’s core flows
  const docs: Array<{
    key: string;
    category: string;
    style: "realish" | "fake";
  }> = [];

  // Always required (per your document-tracking)
  docs.push({
    key: "birth_certificate",
    category: "BIRTH_CERTIFICATE",
    style: "realish",
  });

  if (p.relationship === "Self" && p.hasNameChanges) {
    const n = Math.max(1, p.numberOfMarriages || 1);
    for (let i = 1; i <= n; i++) {
      docs.push({
        key: `marriage_certificate_${i}`,
        category: "MARRIAGE_CERTIFICATE",
        style: i % 2 === 0 ? "fake" : "realish",
      });
    }
  }

  const claimantDeceased = (p.claimantDeceased || "").toUpperCase() === "YES";
  if (p.relationship === "Spouse" && claimantDeceased) {
    docs.push({
      key: "death_certificate",
      category: "DEATH_CERTIFICATE",
      style: "realish",
    });
  }
  if (
    (p.relationship === "Child" ||
      p.relationship === "Parent" ||
      p.relationship === "Grandchild" ||
      p.relationship === "Grandparent") &&
    p.claimantDod
  ) {
    docs.push({
      key: "death_certificate",
      category: "DEATH_CERTIFICATE",
      style: "realish",
    });
  }

  docs.push({
    key: "medical_documentation",
    category: "MEDICAL_RECORDS",
    style: "fake",
  });

  // Two proofs of presence
  docs.push({
    key: "proof_of_presence_1",
    category: "SCHOOL_RECORDS",
    style: "realish",
  });
  docs.push({
    key: "proof_of_presence_2",
    category: "TAX_RETURN",
    style: "fake",
  });

  return docs;
}

function toPersona(row: Row): Persona {
  const diseases = parseJson<string[]>(row["P10: Diseases (JSON array)"], []);
  const exposure = row["P8: Exposure Options (JSON array)"] || "";

  return {
    id: row["Persona ID"],
    name: row["Persona Name"],
    relationship: row["P3: Relationship"] || "Self",
    filingForSelf: bool(row["P1: Filing For Self"]),
    firstName: row["P1: First Name"],
    lastName: row["P1: Last Name"],
    ssn: row["P1: SSN"],
    dob: row["P1: DOB"],
    address: row["P1: Address"],
    city: row["P1: City"],
    state: row["P1: State"],
    zip: row["P1: Zip"],
    phone: row["P1: Phone"],
    email: row["P1: Email"],
    hasNameChanges: bool(row["P4: Has Name Changes"]),
    numberOfMarriages: Number(row["P4: Number of Marriages"] || 0),
    diseases,
    proofDesc: row["P9: Proof Documents Description"] || "",
    exposure,
    claimantFirstName: row["P2: First Name"] || undefined,
    claimantLastName: row["P2: Last Name"] || undefined,
    claimantSsn: row["P2: SSN"] || undefined,
    claimantDob: row["P2: DOB"] || undefined,
    claimantDod: row["P2: DOD"] || undefined,
    claimantDeceased: row["P5: Claimant Deceased"] || undefined,
  };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: pnpm -s tsx scripts/mock-docs/generate.ts <csvPath>");
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Row[];

  const outRoot = path.join(process.cwd(), "mock-docs");
  fs.mkdirSync(outRoot, { recursive: true });

  const manifest: any[] = [];

  for (const row of rows) {
    const id = (row["Persona ID"] || "").trim();
    if (!id || id === "Persona ID") continue;

    const p = toPersona(row);
    const dir = path.join(outRoot, `${p.id}_${safeName(p.name)}`);
    fs.mkdirSync(dir, { recursive: true });

    const docs = requiredDocs(p);

    const baseLines: Array<[string, string]> = [
      ["Persona", `${p.id} — ${p.name}`],
      ["Relationship", p.relationship],
      ["Filer Name", `${p.firstName} ${p.lastName}`],
      ["Filer DOB", p.dob],
      ["Filer SSN", p.ssn],
      ["Address", `${p.address}, ${p.city}, ${p.state} ${p.zip}`],
      ["Phone", p.phone],
      ["Email", p.email],
      ["Exposure", p.exposure],
      ["Diseases", p.diseases.join(", ")],
    ];

    const readmeLines: string[] = [];
    readmeLines.push(`# Mock Docs — ${p.id}: ${p.name}`);
    readmeLines.push("");
    readmeLines.push(`Relationship: **${p.relationship}**`);
    readmeLines.push("");
    readmeLines.push("## Files");

    for (const doc of docs) {
      const pdfPath = path.join(dir, `${doc.key}.pdf`);
      const style = doc.style;

      const titleMap: Record<string, string> = {
        birth_certificate: "Certificate of Live Birth",
        death_certificate: "Certificate of Death",
        medical_documentation: "Medical Records Summary",
      };
      const title =
        titleMap[doc.key] ||
        doc.key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

      const extra: Array<[string, string]> = [];
      if (doc.category === "MARRIAGE_CERTIFICATE") {
        extra.push(["Document Type", "Marriage Certificate"]);
        extra.push(["County", "Sample County"]);
      }
      if (doc.category === "DEATH_CERTIFICATE") {
        extra.push([
          "Decedent",
          `${p.claimantFirstName || ""} ${p.claimantLastName || ""}`.trim() ||
            "Claimant",
        ]);
        extra.push(["Date of Death", p.claimantDod || ""]);
      }
      if (doc.category === "MEDICAL_RECORDS") {
        extra.push(["Primary Diagnosis", p.diseases[0] || ""]);
        extra.push(["Attending Provider", "Sample Oncology Clinic"]);
        extra.push(["Record Date", "2024-10-12"]);
      }
      if (doc.key.startsWith("proof_of_presence")) {
        extra.push(["Proof Type", doc.category]);
        extra.push(["Notes", p.proofDesc || ""]);
      }

      await makePdf(pdfPath, {
        title,
        subtitle:
          style === "realish"
            ? "Issued by Sample Vital Records Office"
            : "RadiantClaims Sample (QA) Document",
        lines: [...extra, ...baseLines],
        style,
      });

      readmeLines.push(`- **${path.basename(pdfPath)}** → \
  expected category: \
  \`${doc.category}\` \
  (style: ${style})`);

      manifest.push({
        personaId: p.id,
        personaName: p.name,
        file: pdfPath,
        expectedCategory: doc.category,
        style,
      });
    }

    fs.writeFileSync(path.join(dir, "README.md"), readmeLines.join("\n"));
  }

  fs.writeFileSync(
    path.join(outRoot, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`Generated mock docs in: ${outRoot}`);
  console.log(`Manifest: ${path.join(outRoot, "manifest.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
