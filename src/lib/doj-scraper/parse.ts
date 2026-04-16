/**
 * DOJ Awards Page Parser
 *
 * Extracts claim statistics (pending, approved, denied, dollars approved,
 * total claims) from the DOJ Civil Division's RECA awards HTML page.
 *
 * Used by:
 *   - `src/app/api/doj/scrape/route.ts` — manual/admin scrape endpoint
 *   - `src/lib/doj-scraper-webfetch.ts` — cron-driven daily scraping
 *
 * Having this in its own file keeps both callers in sync.
 */

export interface DOJClaimStats {
  pending: number;
  approved: number;
  approvalPercent: number;
  dollarsApproved: number;
  denied: number;
  totalClaims: number;
}

export interface DOJPageData {
  DOWNWINDER: DOJClaimStats;
  ONSITE_PARTICIPANT: DOJClaimStats;
  MANHATTAN_PROJECT_WASTE: DOJClaimStats;
  URANIUM_WORKER: DOJClaimStats;
}

const EMPTY_STATS: DOJClaimStats = {
  pending: 0,
  approved: 0,
  approvalPercent: 0,
  dollarsApproved: 0,
  denied: 0,
  totalClaims: 0,
};

const extractNumber = (text: string | undefined): number => {
  if (!text) return 0;
  const match = text.match(/[\d,]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/,/g, ""), 10);
};

const extractPercent = (text: string | undefined): number => {
  if (!text) return 0;
  const match = text.match(/([\d.]+)/);
  if (!match) return 0;
  return parseFloat(match[1] || "0");
};

const extractDollars = (text: string | undefined): number => {
  if (!text) return 0;
  const match = text.match(/[\d,]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/,/g, ""), 10);
};

// Pattern matches a table row sequence after a category label:
// <td>pending</td><td>approved</td><td>%</td><td>$dollars</td><td>denied</td><td>total</td>
const ROW_PATTERN =
  /<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i;

function matchCategory(html: string, label: RegExp): DOJClaimStats {
  const section = html.match(
    new RegExp(label.source + "[\\s\\S]{0,200}?" + ROW_PATTERN.source, "i")
  );
  if (!section) return { ...EMPTY_STATS };
  return {
    pending: extractNumber(section[1]),
    approved: extractNumber(section[2]),
    approvalPercent: extractPercent(section[3]),
    dollarsApproved: extractDollars(section[4]),
    denied: extractNumber(section[5]),
    totalClaims: extractNumber(section[6]),
  };
}

/**
 * Parse a DOJ Civil Division awards page HTML into structured claim stats
 * for each of the four covered categories.
 */
export function parseDOJAwardsPage(html: string): DOJPageData {
  return {
    DOWNWINDER: matchCategory(html, /Downwinder/),
    ONSITE_PARTICIPANT: matchCategory(html, /Onsite\s+Participant/),
    MANHATTAN_PROJECT_WASTE: matchCategory(html, /Manhattan\s+Project\s+Waste/),
    URANIUM_WORKER: matchCategory(html, /Uranium\s+Worker/),
  };
}

/**
 * Fetch DOJ awards HTML for a specific date and parse it into structured
 * data. Returns null if the DOJ page doesn't exist (e.g. weekend/holiday)
 * or the fetch fails.
 *
 * The date format in the URL is MMDDYYYY (no separators).
 */
export async function fetchAndParseDOJForDate(
  date: Date
): Promise<DOJPageData | null> {
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const dateStr = `${mm}${dd}${yyyy}`;
  const url = `https://www.justice.gov/civil/awards-date-${dateStr}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        Referer: "https://www.justice.gov/",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(
        `[doj-scraper] DOJ returned ${response.status} for ${dateStr} (${url})`
      );
      return null;
    }

    const html = await response.text();
    return parseDOJAwardsPage(html);
  } catch (error) {
    console.error(
      `[doj-scraper] fetch failed for ${dateStr}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
