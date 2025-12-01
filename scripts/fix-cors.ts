import { fixR2Cors } from "../src/lib/r2.ts";

async function main() {
  console.log("Attempting to fix R2 CORS settings...");
  try {
    await fixR2Cors();
    console.log("Done! CORS settings applied.");
  } catch (error) {
    console.error("Failed to fix CORS:", error);
  }
}

main();
