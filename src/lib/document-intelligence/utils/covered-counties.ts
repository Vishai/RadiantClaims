/**
 * RECA Covered Counties and Areas
 * Lists all counties affected by nuclear testing for downwinder eligibility
 */

export interface CoveredCounty {
  county: string;
  state: string;
  stateAbbrev: string;
  testPeriod: string;
}

/**
 * Counties affected by Nevada Test Site atmospheric testing (1951-1958, 1962)
 * Source: RECA Section 4(a)(1)(A)(i)
 */
export const DOWNWINDER_COUNTIES: CoveredCounty[] = [
  // Arizona
  {
    county: "Apache",
    state: "Arizona",
    stateAbbrev: "AZ",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Coconino",
    state: "Arizona",
    stateAbbrev: "AZ",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Gila",
    state: "Arizona",
    stateAbbrev: "AZ",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Navajo",
    state: "Arizona",
    stateAbbrev: "AZ",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Yavapai",
    state: "Arizona",
    stateAbbrev: "AZ",
    testPeriod: "1951-1958, 1962",
  },

  // Nevada
  {
    county: "Esmeralda",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Eureka",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Lander",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Lincoln",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Nye",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "White Pine",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Clark",
    state: "Nevada",
    stateAbbrev: "NV",
    testPeriod: "1951-1958, 1962",
  },

  // Utah
  {
    county: "Beaver",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Garfield",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Iron",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Kane",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Millard",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Piute",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "San Juan",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Sevier",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
  {
    county: "Washington",
    state: "Utah",
    stateAbbrev: "UT",
    testPeriod: "1951-1958, 1962",
  },
];

/**
 * Check if a county is in the covered downwinder area
 */
export function isCoveredCounty(county: string, state: string): boolean {
  const normalizedCounty = county
    .toLowerCase()
    .trim()
    .replace(/\s+county$/i, "");
  const normalizedState = state.toLowerCase().trim();

  return DOWNWINDER_COUNTIES.some(
    (covered) =>
      covered.county.toLowerCase() === normalizedCounty &&
      (covered.state.toLowerCase() === normalizedState ||
        covered.stateAbbrev.toLowerCase() === normalizedState)
  );
}

/**
 * Get all covered counties for a specific state
 */
export function getCoveredCountiesByState(state: string): CoveredCounty[] {
  const normalizedState = state.toLowerCase().trim();
  return DOWNWINDER_COUNTIES.filter(
    (county) =>
      county.state.toLowerCase() === normalizedState ||
      county.stateAbbrev.toLowerCase() === normalizedState
  );
}

/**
 * RECA covered diseases for downwinders
 * Source: RECA Section 4(a)(2)
 */
export const COVERED_DISEASES = [
  "Leukemia (other than chronic lymphocytic leukemia)",
  "Multiple Myeloma",
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
  "Primary cancer of the salivary gland",
  "Primary cancer of the urinary bladder",
  "Primary cancer of the brain",
  "Primary cancer of the colon",
  "Primary cancer of the ovary",
  "Primary cancer of the liver (except if cirrhosis or hepatitis B is indicated)",
  "Primary cancer of the lung",
];

/**
 * Check if a diagnosis is a covered disease
 */
export function isCoveredDisease(diagnosis: string): boolean {
  const normalizedDiagnosis = diagnosis.toLowerCase().trim();

  // Direct match or substring match
  const directMatch = COVERED_DISEASES.some(
    (disease) =>
      normalizedDiagnosis.includes(disease.toLowerCase()) ||
      disease.toLowerCase().includes(normalizedDiagnosis)
  );

  if (directMatch) return true;

  // Special cases for common cancer names
  if (
    normalizedDiagnosis.includes("breast cancer") ||
    normalizedDiagnosis.includes("breast carcinoma")
  ) {
    return true; // Matches "Primary cancer of the male or female breast"
  }

  if (
    normalizedDiagnosis.includes("lung cancer") ||
    normalizedDiagnosis.includes("lung carcinoma")
  ) {
    return true; // Matches "Primary cancer of the lung"
  }

  if (
    normalizedDiagnosis.includes("thyroid cancer") ||
    normalizedDiagnosis.includes("thyroid carcinoma")
  ) {
    return true; // Matches "Primary cancer of the thyroid"
  }

  // Add more common variations as needed

  return false;
}

/**
 * RECA exposure periods
 */
export const EXPOSURE_PERIODS = {
  downwinder: {
    start: new Date("1951-01-01"),
    end: new Date("1958-12-31"),
    additionalPeriod: {
      start: new Date("1962-01-01"),
      end: new Date("1962-12-31"),
    },
  },
  onsiteParticipant: {
    start: new Date("1945-01-01"),
    end: new Date("1962-12-31"),
  },
  uraniumWorker: {
    start: new Date("1942-01-01"),
    end: new Date("1971-12-31"),
  },
};

/**
 * Check if a date falls within a covered exposure period
 */
export function isInExposurePeriod(
  date: Date,
  claimType: "downwinder" | "onsite" | "uranium"
): boolean {
  if (claimType === "downwinder") {
    const period1 =
      date >= EXPOSURE_PERIODS.downwinder.start &&
      date <= EXPOSURE_PERIODS.downwinder.end;
    const period2 =
      date >= EXPOSURE_PERIODS.downwinder.additionalPeriod.start &&
      date <= EXPOSURE_PERIODS.downwinder.additionalPeriod.end;
    return period1 || period2;
  }

  if (claimType === "onsite") {
    return (
      date >= EXPOSURE_PERIODS.onsiteParticipant.start &&
      date <= EXPOSURE_PERIODS.onsiteParticipant.end
    );
  }

  if (claimType === "uranium") {
    return (
      date >= EXPOSURE_PERIODS.uraniumWorker.start &&
      date <= EXPOSURE_PERIODS.uraniumWorker.end
    );
  }

  return false;
}
