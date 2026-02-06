const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
  dc: "DC",
};

/**
 * Accepts either a 2-letter code ("UT") or full state name ("Utah").
 */
export function normalizeStateInput(state?: string | null): string | undefined {
  if (!state) return undefined;
  const trimmed = state.trim();
  if (!trimmed) return undefined;

  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  return STATE_NAME_TO_CODE[trimmed.toLowerCase()] || trimmed.toUpperCase();
}

/**
 * Normalizes county names so "Salt Lake County" and "Salt Lake" both match.
 */
export function normalizeCountyInput(
  county?: string | null
): string | undefined {
  if (!county) return undefined;

  const trimmed = county.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/\s+county$/i, "").trim();
}
