/**
 * Seed cancer registries for RECA-relevant states
 * These are the states most affected by nuclear testing fallout
 *
 * Run: npx tsx scripts/seed-cancer-registries.ts
 */

import { prisma } from "../src/lib/prisma";
import { ResourceType } from "@prisma/client";

interface CancerRegistryData {
  name: string;
  state: string;
  county?: string;
  city: string;
  address: string;
  zipCode: string;
  phone: string;
  phoneTollFree?: string;
  email?: string;
  website: string;
  notes: string;
}

const cancerRegistries: CancerRegistryData[] = [
  // UTAH
  {
    name: "Utah Cancer Registry",
    state: "UT",
    city: "Salt Lake City",
    address: "295 Chipeta Way",
    zipCode: "84108",
    phone: "801-581-8407",
    email: "ucr.info@hsc.utah.edu",
    website:
      "https://healthcare.utah.edu/huntsmancancerinstitute/research/updb/utah-cancer-registry/",
    notes:
      "The Utah Cancer Registry (UCR) is a population-based surveillance system that collects data on all cancer diagnoses in Utah. Part of the University of Utah Huntsman Cancer Institute. Provides cancer incidence data for RECA claims. Required for documenting cancer diagnoses in Utah residents.",
  },

  // ARIZONA
  {
    name: "Arizona Cancer Registry",
    state: "AZ",
    city: "Phoenix",
    address: "150 N 18th Avenue, Suite 310",
    zipCode: "85007",
    phone: "602-542-7307",
    email: "azcr@azdhs.gov",
    website:
      "https://www.azdhs.gov/preparedness/epidemiology-disease-control/cancer-registry/",
    notes:
      "The Arizona Cancer Registry is a population-based surveillance system operated by the Arizona Department of Health Services. Collects cancer incidence data for all Arizona residents. Essential for RECA claims requiring documentation of cancer diagnoses in Arizona. Part of the CDC's National Program of Cancer Registries.",
  },

  // NEVADA
  {
    name: "Nevada Central Cancer Registry",
    state: "NV",
    city: "Carson City",
    address: "4150 Technology Way, Suite 210",
    zipCode: "89706",
    phone: "775-684-4284",
    phoneTollFree: "888-886-4284",
    email: "nccr@health.nv.gov",
    website: "https://www.health.nv.gov/Programs/CancerRegistry/",
    notes:
      "Nevada Central Cancer Registry (NCCR) is a statewide, population-based cancer surveillance system. Collects data on all cancer cases diagnosed in Nevada residents. Critical for RECA downwinder claims from Nevada, especially areas near the Nevada Test Site. Provides certified copies of cancer diagnosis records.",
  },

  // NEW MEXICO
  {
    name: "New Mexico Tumor Registry",
    state: "NM",
    city: "Albuquerque",
    address: "MSC08 4630, 1 University of New Mexico",
    zipCode: "87131",
    phone: "505-925-0495",
    email: "nmtr@salud.unm.edu",
    website: "https://nmhealth.org/about/phd/cdb/cncp/nmtr/",
    notes:
      "New Mexico Tumor Registry (NMTR) is a statewide cancer surveillance program operated by the University of New Mexico Comprehensive Cancer Center. Collects cancer incidence data for all New Mexico residents. Essential for RECA claims from uranium miners, millers, and ore transporters, as well as downwinders. Covers all counties including uranium mining areas.",
  },

  // IDAHO
  {
    name: "Idaho Cancer Registry",
    state: "ID",
    city: "Boise",
    address: "450 W State St, 4th Floor",
    zipCode: "83702",
    phone: "208-334-6527",
    email: "cancerdata@dhw.idaho.gov",
    website:
      "https://healthandwelfare.idaho.gov/health-wellness/public-health-data/idaho-cancer-registry",
    notes:
      "Idaho Cancer Registry maintains a database of all cancer cases diagnosed in Idaho residents. Operated by the Idaho Department of Health and Welfare. Provides cancer incidence data for RECA claims. Idaho was affected by fallout from nuclear testing in Nevada, making this registry important for downwinder claims from southeastern Idaho counties.",
  },
];

async function seedCancerRegistries() {
  console.log("🔬 Seeding Cancer Registries for RECA States...\n");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const registry of cancerRegistries) {
    try {
      // Check if already exists
      const existing = await prisma.documentResource.findFirst({
        where: {
          name: registry.name,
          state: registry.state,
        },
      });

      if (existing) {
        // Update existing record
        await prisma.documentResource.update({
          where: { id: existing.id },
          data: {
            resourceType: "CANCER_REGISTRY" as ResourceType,
            city: registry.city,
            address: registry.address,
            zipCode: registry.zipCode,
            phone: registry.phone,
            phoneTollFree: registry.phoneTollFree || null,
            email: registry.email || null,
            website: registry.website,
            notes: registry.notes,
            county: registry.county || null,
            stateCode: registry.state,
            documentTypesProvided: ["MEDICAL_RECORDS", "CANCER_DIAGNOSIS"],
            acceptsMailRequests: true,
            acceptsOnlineRequests: true,
            certificationAvailable: true,
            source: "STAFF_VERIFIED",
            verificationStatus: "VERIFIED", // Manually verified
            verifiedBy: "RadiantClaims Team",
            verifiedAt: new Date(),
            estimatedCost: 0, // Usually free for RECA purposes
            processingTimeDays: 14, // Typical processing time
            specialInstructions:
              "For RECA claims, specify that you need cancer diagnosis records for radiation exposure compensation. Include patient name, date of birth, and approximate diagnosis date.",
          },
        });
        console.log(`   ✅ Updated: ${registry.name} (${registry.state})`);
        updated++;
      } else {
        // Create new record
        await prisma.documentResource.create({
          data: {
            resourceType: "CANCER_REGISTRY" as ResourceType,
            name: registry.name,
            state: registry.state,
            county: registry.county || null,
            city: registry.city,
            address: registry.address,
            stateCode: registry.state,
            zipCode: registry.zipCode,
            phone: registry.phone,
            phoneTollFree: registry.phoneTollFree || null,
            email: registry.email || null,
            website: registry.website,
            notes: registry.notes,
            documentTypesProvided: ["MEDICAL_RECORDS", "CANCER_DIAGNOSIS"],
            acceptsMailRequests: true,
            acceptsOnlineRequests: true,
            certificationAvailable: true,
            source: "STAFF_VERIFIED",
            verificationStatus: "VERIFIED", // Manually verified
            verifiedBy: "RadiantClaims Team",
            verifiedAt: new Date(),
            estimatedCost: 0, // Usually free for RECA purposes
            processingTimeDays: 14, // Typical processing time
            specialInstructions:
              "For RECA claims, specify that you need cancer diagnosis records for radiation exposure compensation. Include patient name, date of birth, and approximate diagnosis date.",
          },
        });
        console.log(`   ✨ Created: ${registry.name} (${registry.state})`);
        created++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${registry.name}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${created + updated + skipped}\n`);

  console.log("✅ Cancer registry seeding complete!\n");
  console.log(
    "📝 Note: These registries are marked as VERIFIED and will appear"
  );
  console.log("   in database searches with high priority.\n");
}

// Run the seed
seedCancerRegistries()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
