import { PrismaClient, RECAFormType } from "@prisma/client";

const db = new PrismaClient();

async function seedRECAForms() {
  console.log("🌱 Seeding RECA forms...");

  const forms = [
    {
      formType: RECAFormType.DOWNWINDER,
      fileName: "RECA Downwinder Claim Form.pdf",
      fileKey: "forms/RECA-Downwinder-Claim-Form.pdf", // R2 key
      version: "Revised July 2025",
      pageCount: 16,
      description:
        "Claim form for individuals who lived in designated affected areas during atmospheric nuclear testing (1951-1962 in Nevada, or 1945-1962 in Utah, Arizona, and Nevada) and developed specified cancers.",
      instructions:
        "This form is for Downwinders - individuals who resided in affected areas during nuclear testing. You must provide: (1) Proof of physical presence in an affected area for the required period, (2) Medical documentation of a compensable disease, (3) Supporting identity and residence documents. The form requires information about yourself or the deceased person, residence history, medical diagnosis, and supporting documentation.",
      oMBApprovalNo: "1105-0052",
    },
    {
      formType: RECAFormType.URANIUM_WORKER,
      fileName: "RECA Uranium Worker Claim Form.pdf",
      fileKey: "forms/RECA-Uranium-Worker-Claim-Form.pdf", // R2 key
      version: "Revised July 2025",
      pageCount: 14,
      description:
        "Claim form for uranium miners, millers, and ore transporters who worked in the uranium industry and developed specified illnesses.",
      instructions:
        "This form is for Uranium Workers - individuals employed in uranium mines, mills, or ore transport. You must provide: (1) Employment verification showing work dates and locations, (2) Medical documentation of a compensable disease, (3) Social Security Administration employment records if available. The form covers miners who worked underground, millers who processed uranium ore, and transporters who hauled ore.",
      oMBApprovalNo: "1105-0052",
    },
    {
      formType: RECAFormType.MANHATTAN_PROJECT_WASTE,
      fileName: "RECA Manhattan Project Waste Claim Form.pdf",
      fileKey: "forms/RECA-Manhattan-Project-Waste-Claim-Form.pdf", // R2 key
      version: "Revised July 2025",
      pageCount: 14,
      description:
        "Claim form for individuals who lived near Manhattan Project waste sites and developed specified cancers.",
      instructions:
        "This form is for individuals who resided near certain Manhattan Project waste disposal sites. You must provide: (1) Proof of residence near a designated site during the specified time period, (2) Medical documentation of a compensable disease, (3) Supporting residence documents such as school records, tax records, or utility bills.",
      oMBApprovalNo: "1105-0052",
    },
    {
      formType: RECAFormType.GENERAL_RECA,
      fileName: "RECA Claim Form.pdf",
      fileKey: "forms/RECA-Claim-Form.pdf", // R2 key
      version: "Revised July 2025",
      pageCount: 12,
      description:
        "General RECA claim form for onsite participants at atmospheric nuclear tests.",
      instructions:
        "This form is for individuals who participated onsite at atmospheric nuclear weapons tests. You must provide: (1) Military service records, Department of Energy (DOE) records, or other employment documentation showing participation, (2) Medical documentation of a compensable disease. This includes military personnel, civilian workers, and others present at test sites.",
      oMBApprovalNo: "1105-0052",
    },
  ];

  for (const form of forms) {
    await db.rECAForm.upsert({
      where: {
        formType: form.formType,
      },
      update: form,
      create: form,
    });
    console.log(`✅ Seeded form: ${form.formType}`);
  }

  console.log("✅ RECA forms seeding complete!");
}

async function main() {
  try {
    await seedRECAForms();
  } catch (error) {
    console.error("❌ Error seeding RECA forms:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
