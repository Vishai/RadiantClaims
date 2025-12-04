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
  yearOpened?: number;
  yearClosed?: number;
  stillOperating?: boolean;
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
  query?: string; // Allow explicit query
}): Promise<ContactFromWeb[]> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const hasQueryString = (query.query || "").trim().length >= 3;
  const hasContext =
    query.state || query.county || query.documentType || query.institutionType;

  if (!hasQueryString && !hasContext) {
    console.warn(
      "[Web Search] Skipping search: insufficient query/context provided"
    );
    return [];
  }

  if (!TAVILY_API_KEY) {
    console.warn("TAVILY_API_KEY not set, skipping web search");
    return [];
  }

  try {
    // Build search query
    let searchQuery = "";

    if (query.query) {
      // If explicit query is provided, use it primarily
      // E.g. "St Marks Hospital Salt Lake City"
      searchQuery = query.query;

      // Append state if not present in query (simple check)
      if (
        query.state &&
        !searchQuery.toLowerCase().includes(query.state.toLowerCase())
      ) {
        searchQuery += ` ${query.state}`;
      }

      // Append "contact" only, to keep it focused but get contact info
      searchQuery += " contact info";
    } else {
      // Construct from components
      const searchTerms = [];

      if (query.county && query.state) {
        searchTerms.push(`${query.county} County ${query.state}`);
      } else if (query.state) {
        searchTerms.push(query.state);
      }

      if (query.institutionType) {
        searchTerms.push(
          query.institutionType.toLowerCase().replace(/_/g, " ")
        );
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
      searchQuery = searchTerms.join(" ");
    }

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
        search_depth: "basic", // Changed from "advanced" - faster and often better for direct queries
        include_answer: false, // Don't need AI answer, we'll parse ourselves
        include_raw_content: false,
        max_results: 8, // Increased from 5 to match Serper
        // Removed include_domains restriction - many hospitals/institutions use .com/.org
        // Google's ranking is often better than manual filtering
      }),
    });

    if (!response.ok) {
      console.error("Tavily API error:", response.status);
      return [];
    }

    const data = await response.json();

    // Convert Tavily results to standard WebSearchResult format
    const searchResults: WebSearchResult[] = (data.results || []).map(
      (r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content || r.snippet || "", // Tavily uses 'content' field
      })
    );

    if (searchResults.length === 0) {
      console.log("[Web Search] No results from Tavily");
      return [];
    }

    console.log(
      `[Web Search] Tavily returned ${searchResults.length} results, parsing with AI...`
    );

    // Use AI parsing (same as Serper) instead of regex extraction
    const parsedContacts = await parseSearchResultsWithAI(searchResults, query);

    // Deduplicate results before returning
    return deduplicateContacts(parsedContacts);
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
  query?: string; // Allow explicit query
}): Promise<ContactFromWeb[]> {
  const SERPER_API_KEY = process.env.SERPER_API_KEY; // Serper.dev for Google Search API
  const hasQueryString = (query.query || "").trim().length >= 3;
  const hasContext =
    query.state || query.county || query.documentType || query.institutionType;

  if (!hasQueryString && !hasContext) {
    console.warn(
      "[Web Search AI] Skipping search: insufficient query/context provided"
    );
    return [];
  }

  if (!SERPER_API_KEY) {
    console.warn("SERPER_API_KEY not set, skipping web search");
    return [];
  }

  try {
    // Build search query
    let searchQuery = "";

    if (query.query) {
      // If explicit query is provided, use it primarily
      // E.g. "St Marks Hospital Salt Lake City"
      searchQuery = query.query;

      // Append state if not present in query (simple check)
      if (
        query.state &&
        !searchQuery.toLowerCase().includes(query.state.toLowerCase())
      ) {
        searchQuery += ` ${query.state}`;
      }

      // Append "contact" only
      searchQuery += " contact address phone";
    } else {
      const searchTerms = [];

      if (query.county && query.state) {
        searchTerms.push(`"${query.county} County" ${query.state}`);
      } else if (query.state) {
        searchTerms.push(query.state);
      }

      // Add institution type - use a map for better search terms
      if (query.institutionType) {
        const institutionMap: Record<string, string> = {
          VITAL_RECORDS: "vital records office",
          COUNTY_CLERK: "county clerk",
          COUNTY_RECORDER: "county recorder",
          HOSPITAL: "hospital medical records",
          CANCER_REGISTRY: "cancer registry",
          SCHOOL_DISTRICT: "school district records",
          CHURCH: "church records",
          TRIBAL_OFFICE: "tribal office records",
        };
        searchTerms.push(
          institutionMap[query.institutionType] ||
            query.institutionType.toLowerCase().replace(/_/g, " ")
        );
      }

      if (query.documentType === "BIRTH_CERTIFICATE") {
        searchTerms.push("birth certificate");
      }

      searchTerms.push("contact phone address");
      searchQuery = searchTerms.join(" ");
    }

    console.log(`[AI Web Search] Searching Google via Serper: ${searchQuery}`);
    console.log(
      `[AI Web Search] Serper API Key status: ${SERPER_API_KEY ? "Set" : "Not Set"}`
    );

    // Use Serper.dev API (Google Search)
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 8, // Get top 8 results
      }),
    });

    if (!response.ok) {
      console.error(
        `[AI Web Search] Serper API error: ${response.status} - ${response.statusText}`
      );
      const errorText = await response.text();
      console.error(`[AI Web Search] Serper API error details: ${errorText}`);
      return [];
    }

    const data = await response.json();

    // Use AI to parse the search results for better accuracy
    // This handles unstructured data much better than regex
    const searchResults: WebSearchResult[] = (data.organic || []).map(
      (r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })
    );

    if (searchResults.length === 0) return [];

    const parsedContacts = await parseSearchResultsWithAI(searchResults, query);

    // Deduplicate results before returning
    return deduplicateContacts(parsedContacts);
  } catch (error) {
    console.error("AI web search error:", error);
    return [];
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
- City
- State
- Website URL
- Year opened/founded (if mentioned)
- Year closed (if mentioned, or if described as "closed", "defunct", "no longer operating")
- Still operating (boolean - true if currently open, false if closed)
- Any relevant notes

Return as JSON array.`;

    const response = await openai.chat.completions.create({
      model: CONTACT_AGENT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a data extraction expert. Extract contact information from search results accurately. Ensure City and State are extracted as separate fields if available within the address, and the institution's primary contact phone number.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for factual extraction
    });

    const extracted = JSON.parse(
      response.choices[0]?.message?.content || '{"institutions": []}'
    );

    return (extracted.institutions || []).map((c: any) => ({
      name: c.institution_name || c.name, // Handle both potential keys from AI
      type: c.type,
      address: c.physical_address || c.address, // Handle both potential keys
      city: c.city,
      state: c.state,
      phone: c.phone_number || c.phone, // Handle both potential keys
      email: c.email,
      website: c.website_url || c.website, // Handle both potential keys
      yearOpened: c.year_opened || c.yearOpened,
      yearClosed: c.year_closed || c.yearClosed,
      stillOperating:
        c.still_operating !== undefined
          ? c.still_operating
          : c.stillOperating !== undefined
            ? c.stillOperating
            : true,
      notes: c.notes,
      source: "Web Search (AI Parsed)", // Both Tavily and Serper now use AI parsing
      sourceUrl: c.website_url || c.website || "", // Use AI website or fallback
    }));
  } catch (error) {
    console.error("AI parsing error:", error);
    return [];
  }
}

/**
 * Deduplicate contact results by phone number and email
 * Consolidates multiple entries for the same institution into one comprehensive record
 * Preserves multiple locations and phone numbers as they may serve different communities
 */
export function deduplicateContacts(
  contacts: ContactFromWeb[]
): ContactFromWeb[] {
  if (contacts.length <= 1) return contacts;

  const deduped = new Map<
    string,
    ContactFromWeb & {
      allPhones?: string[];
      allAddresses?: string[];
      allCities?: string[];
    }
  >();

  for (const contact of contacts) {
    // Create a deduplication key based on institution name (normalized)
    // Use name as primary key since same institution may have different phones/addresses for different locations
    const normalizedName = contact.name
      .toLowerCase()
      .trim()
      .replace(
        /\b(the|hospital|medical|center|registry|office|department)\b/g,
        ""
      ) // Remove common words
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Also check for phone/email matches to catch variations in naming
    const normalizedPhone = contact.phone?.replace(/\D/g, "").slice(-10);
    const normalizedEmail = contact.email?.toLowerCase().trim();

    // Try to find existing entry by name similarity or exact phone/email match
    let existingKey: string | null = null;
    deduped.forEach((existing, key) => {
      if (existingKey) return;
      const existingNameNorm = existing.name
        .toLowerCase()
        .trim()
        .replace(
          /\b(the|hospital|medical|center|registry|office|department)\b/g,
          ""
        )
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const existingPhone = existing.phone?.replace(/\D/g, "").slice(-10);
      const existingEmail = existing.email?.toLowerCase().trim();

      // Check if it's the same institution
      const nameMatch =
        existingNameNorm === normalizedName ||
        existingNameNorm.includes(normalizedName) ||
        normalizedName.includes(existingNameNorm);
      const phoneMatch = normalizedPhone && existingPhone === normalizedPhone;
      const emailMatch = normalizedEmail && existingEmail === normalizedEmail;

      if (nameMatch || phoneMatch || emailMatch) {
        existingKey = key;
      }
    });

    if (existingKey && deduped.has(existingKey)) {
      // Merge with existing entry
      const existing = deduped.get(existingKey)!;

      // Consolidate phones (collect all unique phone numbers)
      const phones = new Set<string>();
      if (existing.phone) phones.add(existing.phone);
      if (contact.phone) phones.add(contact.phone);
      // Also add from array if exists
      if (existing.allPhones) existing.allPhones.forEach((p) => phones.add(p));

      // Consolidate addresses (collect all unique addresses)
      const addresses = new Set<string>();
      if (existing.address) addresses.add(existing.address);
      if (contact.address) addresses.add(contact.address);
      // Also add from array if exists
      if (existing.allAddresses)
        existing.allAddresses.forEach((a) => addresses.add(a));

      // Consolidate cities (collect all unique cities for location context)
      const cities = new Set<string>();
      if (existing.city) cities.add(existing.city);
      if (contact.city) cities.add(contact.city);
      // Also add from array if exists
      if (existing.allCities) existing.allCities.forEach((c) => cities.add(c));

      // Consolidate emails (collect all unique emails)
      const emails = new Set<string>();
      if (existing.email) emails.add(existing.email);
      if (contact.email) emails.add(contact.email);

      // Consolidate websites (collect all unique websites)
      const websites = new Set<string>();
      if (existing.website) websites.add(existing.website);
      if (contact.website) websites.add(contact.website);

      // Consolidate notes
      const notes = [existing.notes, contact.notes]
        .filter(Boolean)
        .join("\n\n");

      const phonesArray = Array.from(phones);
      const addressesArray = Array.from(addresses);
      const citiesArray = Array.from(cities);

      // Merge the records - prefer non-empty fields
      deduped.set(existingKey, {
        ...existing,
        name: existing.name, // Keep first name (usually most complete)
        phone: phonesArray[0], // Primary phone
        allPhones: phonesArray, // All phone numbers
        address: addressesArray[0], // Primary address
        allAddresses: addressesArray, // All addresses
        city: citiesArray[0], // Primary city
        allCities: citiesArray, // All cities
        email:
          emails.size > 1
            ? Array.from(emails).join(", ")
            : existing.email || contact.email,
        website:
          websites.size > 1
            ? Array.from(websites)[0] // Use first website
            : existing.website || contact.website,
        state: existing.state || contact.state,
        county: existing.county || contact.county,
        notes: notes || existing.notes || contact.notes,
        yearOpened: existing.yearOpened || contact.yearOpened,
        yearClosed: existing.yearClosed || contact.yearClosed,
        stillOperating:
          existing.stillOperating !== undefined
            ? existing.stillOperating
            : contact.stillOperating,
      });
    } else {
      // First occurrence
      const key =
        normalizedName || normalizedPhone || normalizedEmail || contact.name;
      deduped.set(key, {
        ...contact,
        allPhones: contact.phone ? [contact.phone] : [],
        allAddresses: contact.address ? [contact.address] : [],
        allCities: contact.city ? [contact.city] : [],
      });
    }
  }

  // Convert back to regular ContactFromWeb format with enhanced notes
  const result = Array.from(deduped.values()).map((contact) => {
    const hasMultipleLocations =
      contact.allAddresses && contact.allAddresses.length > 1;
    const hasMultiplePhones = contact.allPhones && contact.allPhones.length > 1;

    let enhancedNotes = contact.notes || "";

    // Add location information to notes
    if (hasMultipleLocations) {
      const locationInfo = contact
        .allAddresses!.map((addr, idx) => {
          const city = contact.allCities?.[idx] || "";
          return `${addr}${city ? `, ${city}` : ""}`;
        })
        .join("\n• ");

      enhancedNotes = `MULTIPLE LOCATIONS - This institution has ${contact.allAddresses!.length} locations that may serve different communities:\n• ${locationInfo}\n\n${enhancedNotes}`;
    }

    // Add phone information to notes
    if (hasMultiplePhones) {
      const phoneInfo = contact
        .allPhones!.map((phone, idx) => {
          // Try to associate phone with location if we have same number of each
          if (
            contact.allAddresses &&
            contact.allAddresses.length === contact.allPhones!.length
          ) {
            return `${phone} (${contact.allAddresses[idx]})`;
          }
          return phone;
        })
        .join("\n• ");

      enhancedNotes = `MULTIPLE CONTACT NUMBERS:\n• ${phoneInfo}\n\n${enhancedNotes}`;
    }

    // Return clean ContactFromWeb object (without our internal tracking fields)
    const { allPhones, allAddresses, allCities, ...cleanContact } = contact;

    return {
      ...cleanContact,
      notes: enhancedNotes.trim() || contact.notes,
    };
  });

  // Log deduplication results
  if (result.length < contacts.length) {
    console.log(
      `[Deduplication] Reduced ${contacts.length} results to ${result.length} unique contact(s)`
    );

    // Log details about consolidated information
    result.forEach((contact) => {
      const match = deduped.get(contact.name);
      if (match?.allAddresses && match.allAddresses.length > 1) {
        console.log(
          `  - ${contact.name}: ${match.allAddresses.length} locations consolidated`
        );
      }
      if (match?.allPhones && match.allPhones.length > 1) {
        console.log(
          `  - ${contact.name}: ${match.allPhones.length} phone numbers consolidated`
        );
      }
    });
  }

  return result;
}
