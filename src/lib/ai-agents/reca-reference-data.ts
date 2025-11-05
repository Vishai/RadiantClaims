/**
 * RECA Reference Data
 *
 * Constants and reference data for RECA validation agents
 */

// ============================================================================
// COVERED DISEASES (for MedicalComplianceAgent)
// ============================================================================

export const RECA_COVERED_DISEASES = [
  "Leukemia (other than chronic lymphocytic leukemia)",
  "Multiple myeloma",
  "Lymphomas (other than Hodgkin's disease)",
  "Primary cancer of the thyroid",
  "Primary cancer of the male or female breast",
  "Primary cancer of the esophagus",
  "Primary cancer of the stomach",
  "Primary cancer of the pharynx",
  "Primary cancer of the small intestine",
  "Primary cancer of the pancreas",
  "Primary cancer of the bile ducts",
  "Primary cancer of the gall bladder",
  "Primary cancer of the liver",
  "Primary cancer of the lung",
  "Primary cancer of the bone",
  "Primary cancer of the brain",
  "Primary cancer of the bladder",
  "Primary cancer of the kidney",
  "Primary cancer of the renal pelvis",
  "Primary cancer of the ureter",
  "Primary cancer of the ovary",
  "Primary cancer of the colon",
  "Primary cancer of the salivary gland",
] as const;

// ============================================================================
// COVERED COUNTIES (for ResidenceProofAgent)
// ============================================================================

export interface CoveredCounty {
  state: string;
  county: string;
  notes?: string;
}

export const RECA_COVERED_COUNTIES: CoveredCounty[] = [
  // Arizona
  { state: "AZ", county: "Apache" },
  { state: "AZ", county: "Coconino" },
  { state: "AZ", county: "Gila" },
  { state: "AZ", county: "Navajo" },
  { state: "AZ", county: "Yavapai" },

  // Nevada
  { state: "NV", county: "Eureka" },
  { state: "NV", county: "Lander" },
  { state: "NV", county: "Lincoln" },
  { state: "NV", county: "Nye" },
  { state: "NV", county: "White Pine" },
  {
    state: "NV",
    county: "Clark",
    notes:
      "Partial coverage - specific townships only: Enterprise, Indian Springs, Moapa, Mountain Springs, Moapa Valley",
  },

  // Utah
  { state: "UT", county: "Beaver" },
  { state: "UT", county: "Garfield" },
  { state: "UT", county: "Iron" },
  { state: "UT", county: "Kane" },
  { state: "UT", county: "Millard" },
  { state: "UT", county: "Piute" },
  { state: "UT", county: "San Juan" },
  { state: "UT", county: "Sevier" },
  { state: "UT", county: "Washington" },
  { state: "UT", county: "Wayne" },
];

/**
 * Check if a county is covered by RECA for downwinders
 */
export function isCoveredCounty(county: string, state: string): boolean {
  const normalizedCounty = county.toLowerCase().trim();
  const normalizedState = state.toUpperCase().trim();

  return RECA_COVERED_COUNTIES.some(
    (c) =>
      c.state === normalizedState && c.county.toLowerCase() === normalizedCounty
  );
}

/**
 * Get coverage notes for a specific county
 */
export function getCountyNotes(county: string, state: string): string | null {
  const normalizedCounty = county.toLowerCase().trim();
  const normalizedState = state.toUpperCase().trim();

  const match = RECA_COVERED_COUNTIES.find(
    (c) =>
      c.state === normalizedState && c.county.toLowerCase() === normalizedCounty
  );

  return match?.notes || null;
}

// ============================================================================
// COVERED FACILITIES (for EmploymentVerificationAgent)
// ============================================================================

export interface CoveredFacility {
  name: string;
  type:
    | "uranium_mine"
    | "test_site"
    | "processing_plant"
    | "laboratory"
    | "other";
  location: {
    city?: string;
    state: string;
  };
  aliases?: string[]; // Common alternative names
  active?: {
    start: string; // YYYY or YYYY-MM-DD
    end?: string; // YYYY or YYYY-MM-DD
  };
}

// Partial list - expand as needed
export const RECA_COVERED_FACILITIES: CoveredFacility[] = [
  // Test Sites
  {
    name: "Nevada Test Site",
    type: "test_site",
    location: { state: "NV" },
    aliases: ["NTS", "Nevada Proving Grounds", "Nevada National Security Site"],
    active: { start: "1951", end: "1992" },
  },
  {
    name: "Trinity Site",
    type: "test_site",
    location: { city: "Alamogordo", state: "NM" },
    active: { start: "1945" },
  },

  // Uranium Processing
  {
    name: "Monticello Mill",
    type: "processing_plant",
    location: { city: "Monticello", state: "UT" },
    active: { start: "1942", end: "1960" },
  },
  {
    name: "Uravan Mill",
    type: "processing_plant",
    location: { city: "Uravan", state: "CO" },
    active: { start: "1936", end: "1984" },
  },

  // Gaseous Diffusion Plants
  {
    name: "Oak Ridge Gaseous Diffusion Plant",
    type: "processing_plant",
    location: { city: "Oak Ridge", state: "TN" },
    aliases: ["K-25", "Oak Ridge K-25"],
    active: { start: "1943" },
  },
  {
    name: "Paducah Gaseous Diffusion Plant",
    type: "processing_plant",
    location: { city: "Paducah", state: "KY" },
    active: { start: "1952" },
  },
  {
    name: "Portsmouth Gaseous Diffusion Plant",
    type: "processing_plant",
    location: { city: "Piketon", state: "OH" },
    active: { start: "1954" },
  },

  // National Laboratories
  {
    name: "Los Alamos National Laboratory",
    type: "laboratory",
    location: { city: "Los Alamos", state: "NM" },
    aliases: ["LANL", "Los Alamos Scientific Laboratory"],
    active: { start: "1943" },
  },
  {
    name: "Hanford Site",
    type: "laboratory",
    location: { city: "Richland", state: "WA" },
    aliases: ["Hanford Engineer Works", "Hanford Nuclear Reservation"],
    active: { start: "1943" },
  },

  // Add more facilities as needed
];

/**
 * Check if a facility is covered by RECA
 */
export function isCoveredFacility(facilityName: string): boolean {
  const normalized = facilityName.toLowerCase().trim();

  return RECA_COVERED_FACILITIES.some(
    (f) =>
      f.name.toLowerCase().includes(normalized) ||
      normalized.includes(f.name.toLowerCase()) ||
      f.aliases?.some(
        (alias) =>
          alias.toLowerCase().includes(normalized) ||
          normalized.includes(alias.toLowerCase())
      )
  );
}

/**
 * Find facility details by name (fuzzy match)
 */
export function findFacility(facilityName: string): CoveredFacility | null {
  const normalized = facilityName.toLowerCase().trim();

  return (
    RECA_COVERED_FACILITIES.find(
      (f) =>
        f.name.toLowerCase().includes(normalized) ||
        normalized.includes(f.name.toLowerCase()) ||
        f.aliases?.some(
          (alias) =>
            alias.toLowerCase().includes(normalized) ||
            normalized.includes(alias.toLowerCase())
        )
    ) || null
  );
}

// ============================================================================
// EXPOSURE PERIODS (for date validation)
// ============================================================================

export const DOWNWINDER_EXPOSURE_PERIOD = {
  start: "1951-01-27", // First Nevada test
  end: "1958-11-04", // Last atmospheric test
} as const;

export const ONSITE_PARTICIPANT_PERIOD = {
  start: "1945-07-16", // Trinity test
  end: "1962-12-31", // End of atmospheric testing era (extended by amendments)
} as const;

export const URANIUM_WORKER_PERIOD = {
  start: "1942-01-01", // Manhattan Project era
  end: "1971-12-31", // End of covered period
} as const;

/**
 * Check if a date falls within a covered exposure period
 */
export function isInExposurePeriod(
  date: string,
  claimType: "downwinder" | "onsite" | "uranium_worker"
): boolean {
  const checkDate = new Date(date);

  let period;
  switch (claimType) {
    case "downwinder":
      period = DOWNWINDER_EXPOSURE_PERIOD;
      break;
    case "onsite":
      period = ONSITE_PARTICIPANT_PERIOD;
      break;
    case "uranium_worker":
      period = URANIUM_WORKER_PERIOD;
      break;
    default:
      return false;
  }

  return (
    checkDate >= new Date(period.start) && checkDate <= new Date(period.end)
  );
}
