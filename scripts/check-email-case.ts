import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking email case sensitivity...\n");

  // Try different case variations
  const variations = [
    "brandonaso@gmail.com",
    "Brandonaso@gmail.com",
    "BRANDONASO@gmail.com",
    "BrandonAso@gmail.com",
  ];

  for (const email of variations) {
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user) {
      console.log(`✅ Found with "${email}"`);
      console.log(`   Stored as: "${user.email}"`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.name}\n`);
    } else {
      console.log(`❌ Not found with "${email}"\n`);
    }
  }

  // Also try to find all attorney accounts
  console.log("=".repeat(80));
  console.log("ALL ATTORNEY ACCOUNTS:");
  console.log("=".repeat(80));

  const attorneys = await prisma.user.findMany({
    where: { role: "ATTORNEY" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (attorneys.length === 0) {
    console.log("No attorney accounts found.");
  } else {
    attorneys.forEach((attorney, index) => {
      console.log(`\n${index + 1}. ${attorney.name || "No name"}`);
      console.log(`   Email: ${attorney.email}`);
      console.log(`   Created: ${attorney.createdAt}`);
    });
  }
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
