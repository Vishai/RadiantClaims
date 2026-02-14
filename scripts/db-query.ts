import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function queryDatabase() {
  try {
    // Example: Find all users
    console.log("📊 Fetching all users...\n");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      take: 10, // Limit to first 10
    });

    console.table(users);

    // Example: Find specific user
    // const user = await prisma.user.findUnique({
    //   where: { email: "admin@radiantclaims.com" }
    // });

    // Example: Update a user
    // const updated = await prisma.user.update({
    //   where: { email: "admin@radiantclaims.com" },
    //   data: { name: "Updated Name" }
    // });

    // Example: Count records
    const counts = {
      users: await prisma.user.count(),
      claimants: await prisma.claimant.count(),
      intakeSessions: await prisma.intakeSession.count(),
    };

    console.log("\n📈 Database Statistics:");
    console.table(counts);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

queryDatabase();
