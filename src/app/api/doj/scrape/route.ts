import { NextRequest, NextResponse } from "next/server";

/**
 * DOJ Scraping API Endpoint
 *
 * GET /api/doj/scrape?date=MMDDYYYY
 *
 * Fetches DOJ awards page and extracts claim statistics
 * Uses server-side fetch with proper headers
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json(
      { error: "Missing date parameter (format: MMDDYYYY)" },
      { status: 400 }
    );
  }

  const url = `https://www.justice.gov/civil/awards-date-${dateParam}`;

  try {
    // Fetch with browser-like headers
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
      // Don't follow redirects automatically
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}`, url },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse the HTML
    const data = parseDOJAwardsPage(html);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error scraping DOJ:", error);
    return NextResponse.json(
      {
        error: "Failed to scrape DOJ data",
        details: error instanceof Error ? error.message : "Unknown error",
        url,
      },
      { status: 500 }
    );
  }
}

function parseDOJAwardsPage(html: string) {
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

  const data = {
    DOWNWINDER: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    ONSITE_PARTICIPANT: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    MANHATTAN_PROJECT_WASTE: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
    URANIUM_WORKER: {
      pending: 0,
      approved: 0,
      approvalPercent: 0,
      dollarsApproved: 0,
      denied: 0,
      totalClaims: 0,
    },
  };

  // Look for Downwinder section (table format)
  // The HTML has table rows where each cell contains a <p> tag with the number
  const downwinderMatch = html.match(
    /Downwinder[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
  );

  if (downwinderMatch) {
    data.DOWNWINDER = {
      pending: extractNumber(downwinderMatch[1]),
      approved: extractNumber(downwinderMatch[2]),
      approvalPercent: extractPercent(downwinderMatch[3]),
      dollarsApproved: extractDollars(downwinderMatch[4]),
      denied: extractNumber(downwinderMatch[5]),
      totalClaims: extractNumber(downwinderMatch[6]),
    };
  }

  // Look for Onsite Participant (table format)
  const onsiteMatch = html.match(
    /Onsite\s+Participant[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
  );

  if (onsiteMatch) {
    data.ONSITE_PARTICIPANT = {
      pending: extractNumber(onsiteMatch[1]),
      approved: extractNumber(onsiteMatch[2]),
      approvalPercent: extractPercent(onsiteMatch[3]),
      dollarsApproved: extractDollars(onsiteMatch[4]),
      denied: extractNumber(onsiteMatch[5]),
      totalClaims: extractNumber(onsiteMatch[6]),
    };
  }

  // Look for Manhattan Project Waste (table format)
  const manhattanMatch = html.match(
    /Manhattan\s+Project\s+Waste[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
  );

  if (manhattanMatch) {
    data.MANHATTAN_PROJECT_WASTE = {
      pending: extractNumber(manhattanMatch[1]),
      approved: extractNumber(manhattanMatch[2]),
      approvalPercent: extractPercent(manhattanMatch[3]),
      dollarsApproved: extractDollars(manhattanMatch[4]),
      denied: extractNumber(manhattanMatch[5]),
      totalClaims: extractNumber(manhattanMatch[6]),
    };
  }

  // Look for Uranium Worker (table format)
  const uraniumMatch = html.match(
    /Uranium\s+Worker[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d.]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>[\s\S]{0,50}?\$([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)[\s\S]{0,200}?<td[\s\S]{0,200}?>([\d,]+)/i
  );

  if (uraniumMatch) {
    data.URANIUM_WORKER = {
      pending: extractNumber(uraniumMatch[1]),
      approved: extractNumber(uraniumMatch[2]),
      approvalPercent: extractPercent(uraniumMatch[3]),
      dollarsApproved: extractDollars(uraniumMatch[4]),
      denied: extractNumber(uraniumMatch[5]),
      totalClaims: extractNumber(uraniumMatch[6]),
    };
  }

  return data;
}
