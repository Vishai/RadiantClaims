/**
 * Web search integration for finding institutional contacts
 * Falls back to web search when database doesn't have the contact
 */

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export interface ContactFromWeb {
  name: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  county?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  source: string;
  sourceUrl: string;
}

/**
 * Search for institutional contacts using Tavily API
 * Tavily is optimized for AI agents and LLMs
 */
export async function searchContactsWeb(query: {
  state?: string;
  county?: string;
  documentType?: string;
  institutionType?: string;
}): Promise<ContactFromWeb[]> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY not set, skipping web search");
    return [];
  }

  try {
    // Build search query
    const searchTerms = [];

    if (query.county && query.state) {
      searchTerms.push(`${query.county} County ${query.state}`);
    } else if (query.state) {
      searchTerms.push(query.state);
    }

    if (query.institutionType) {
      searchTerms.push(query.institutionType.toLowerCase().replace(/_/g, " "));
    }

    if (query.documentType) {
      const docMap: Record<string, string> = {
        BIRTH_CERTIFICATE: "birth certificate",
        DEATH_CERTIFICATE: "death certificate",
        MEDICAL_RECORDS: "medical records",
        SCHOOL_RECORDS: "school records transcripts",
      };
      searchTerms.push(docMap[query.documentType] || query.documentType);
    }

    searchTerms.push("contact phone address");

    const searchQuery = searchTerms.join(" ");

    console.log(`[Web Search] Searching: ${searchQuery}`);

    // Call Tavily API
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "advanced", // More thorough search
        include_answer: true, // Get AI-generated answer
        include_raw_content: false,
        max_results: 5,
        include_domains: [
          // Prioritize official government sites
          "*.gov",
          "*.us",
          "familysearch.org",
          "vitalrecordsoffice.net",
        ],
      }),
    });

    if (!response.ok) {
      console.error("Tavily API error:", response.status);
      return [];
    }

    const data = await response.json();

    // Extract contacts from search results
    const contacts: ContactFromWeb[] = [];

    for (const result of data.results || []) {
      const contact = extractContactFromResult(result, query);
      if (contact) {
        contacts.push(contact);
      }
    }

    return contacts;
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}

/**
 * Alternative: Use OpenAI with function calling to search the web
 * This uses GPT-4 to intelligently extract contact info from search results
 */
export async function searchContactsWithAI(query: {
  state?: string;
  county?: string;
  documentType?: string;
  institutionType?: string;
}): Promise<ContactFromWeb[]> {
  const SERPER_API_KEY = process.env.SERPER_API_KEY; // Serper.dev for Google Search API

  if (!SERPER_API_KEY) {
    console.warn("SERPER_API_KEY not set, skipping web search");
    return [];
  }

  try {
    // Build search query
    const searchTerms = [];

    if (query.county && query.state) {
      searchTerms.push(`"${query.county} County" ${query.state}`);
    } else if (query.state) {
      searchTerms.push(query.state);
    }

    if (query.institutionType === "VITAL_RECORDS") {
      searchTerms.push("vital records office");
    } else if (query.institutionType === "COUNTY_CLERK") {
      searchTerms.push("county clerk");
    } else if (query.institutionType === "HOSPITAL") {
      searchTerms.push("hospital medical records");
    }

    if (query.documentType === "BIRTH_CERTIFICATE") {
      searchTerms.push("birth certificate");
    }

    searchTerms.push("contact phone address");

    const searchQuery = searchTerms.join(" ");

    // Use Serper.dev API (Google Search)
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10,
      }),
    });

    if (!response.ok) {
      console.error("Serper API error:", response.status);
      return [];
    }

    const data = await response.json();

    // Extract contacts from organic results
    const contacts: ContactFromWeb[] = [];

    for (const result of data.organic || []) {
      const contact = extractContactFromResult(
        {
          title: result.title,
          url: result.link,
          snippet: result.snippet,
        },
        query
      );
      if (contact) {
        contacts.push(contact);
      }
    }

    return contacts;
  } catch (error) {
    console.error("AI web search error:", error);
    return [];
  }
}

/**
 * Extract contact information from a search result
 */
function extractContactFromResult(
  result: WebSearchResult,
  query: { state?: string; county?: string }
): ContactFromWeb | null {
  try {
    // Extract phone numbers
    const phonePattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const phones = (result.snippet + " " + (result.content || "")).match(
      phonePattern
    );

    // Extract email addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = (result.snippet + " " + (result.content || "")).match(
      emailPattern
    );

    // Extract address (basic pattern)
    const addressPattern =
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i;
    const addresses = (result.snippet + " " + (result.content || "")).match(
      addressPattern
    );

    // Determine institution type from title/snippet
    let type = "UNKNOWN";
    const lowerText = (result.title + " " + result.snippet).toLowerCase();

    if (lowerText.includes("vital records")) type = "VITAL_RECORDS";
    else if (lowerText.includes("county clerk")) type = "COUNTY_CLERK";
    else if (lowerText.includes("hospital")) type = "HOSPITAL";
    else if (lowerText.includes("cancer registry")) type = "CANCER_REGISTRY";
    else if (lowerText.includes("school district")) type = "SCHOOL_DISTRICT";

    return {
      name: result.title,
      type,
      phone: phones?.[0] || undefined,
      email: emails?.[0] || undefined,
      address: addresses?.[0] || undefined,
      website: result.url,
      state: query.state,
      county: query.county,
      notes: result.snippet,
      source: "Web Search",
      sourceUrl: result.url,
    };
  } catch (error) {
    console.error("Error extracting contact:", error);
    return null;
  }
}

/**
 * Parse web search results using OpenAI
 * This is more intelligent than regex parsing
 */
export async function parseSearchResultsWithAI(
  searchResults: WebSearchResult[],
  query: { state?: string; county?: string; documentType?: string }
): Promise<ContactFromWeb[]> {
  const { openai, CONTACT_AGENT_MODEL } = await import("@/lib/openai");

  try {
    const prompt = `Extract institutional contact information from these search results for ${query.county ? `${query.county} County, ` : ""}${query.state}.

Search Results:
${searchResults.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join("\n\n")}

Extract the following for each relevant institution:
- Institution name
- Type (vital records, hospital, county clerk, etc.)
- Phone number
- Email (if mentioned)
- Physical address
- Website URL
- Any relevant notes

Return as JSON array.`;

    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a data extraction expert. Extract contact information from search results accurately.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for factual extraction
    });

    const extracted = JSON.parse(
      response.choices[0]?.message?.content || '{"contacts": []}'
    );

    return (extracted.contacts || []).map((c: any) => ({
      ...c,
      source: "Web Search (AI Parsed)",
      sourceUrl: c.website || "",
    }));
  } catch (error) {
    console.error("AI parsing error:", error);
    return [];
  }
}
