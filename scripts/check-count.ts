import { db } from "../src/lib/db";

async function checkCount() {
  const count = await db.recaLibrary.count();
  console.log("Prisma Count:", count);

  const rawCount = await db.$queryRaw`SELECT count(*) FROM "RecaLibrary"`;
  console.log("Raw Count:", rawCount);
}

checkCount();
