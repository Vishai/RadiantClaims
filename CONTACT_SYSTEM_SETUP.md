# Contact Agent System - Setup Guide

## Overview

The Contact Agent System helps RECA claimants find institutional contacts (vital records offices, hospitals, schools, etc.) through an AI-powered chat interface. **All data is stored in your own PostgreSQL database** - no external services like Airtable or n8n required.

## Architecture

```
┌─────────────────────────────────────┐
│   Customer Portal UI                │
│   (ContactAgentChat component)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  /api/contact-agent/chat            │
│  (Next.js API route)                │
└──────────────┬──────────────────────┘
               │
          ┌────┴────┐
          ▼         ▼
┌──────────────┐  ┌──────────────┐
│   OpenAI     │  │  PostgreSQL  │
│  (GPT-4)     │  │  (Prisma)    │
└──────────────┘  └──────────────┘
```

## Files Created

### Backend
- `src/lib/openai.ts` - OpenAI client configuration
- `src/lib/contact-agent/search.ts` - Contact search functions
- `src/app/api/contact-agent/chat/route.ts` - AI chat endpoint
- `src/app/api/admin/resources/import/route.ts` - Admin import endpoint

### Frontend
- `src/components/contact-agent/ContactAgentChat.tsx` - React chat component

### Scripts
- `scripts/seed-contacts.ts` - TypeScript seeder (recommended)
- `scripts/import-contacts.py` - Python importer (alternative)

## Setup Instructions

### 1. Environment Variables

Add to your `.env.local`:

```bash
# OpenAI API Key (required for chat agent)
OPENAI_API_KEY=sk-...

# Database already configured
DATABASE_URL=postgresql://...
```

### 2. Seed Sample Contacts

The seed script will add 3 sample contacts (Washington County UT, Clark County NV, Utah Cancer Registry):

```bash
# Make sure database is accessible
npm run db:check

# Seed sample data
DATABASE_URL="your_database_url" npx tsx scripts/seed-contacts.ts
```

### 3. Import Contacts from CSV

You can import contacts from the existing contact-gathering scripts:

```bash
# If you have a CSV file from contact-gathering/
npx tsx scripts/seed-contacts.ts path/to/contacts.csv
```

CSV Format expected:
```csv
State,County,InstitutionName,InstitutionType,Phone,Email,Website,Address,City,ZipCode,RecordTypes,Notes
UT,Washington,Washington County Clerk,vital_records,(435) 301-7200,clerk@washco.utah.gov,https://...,111 E Tabernacle St,St George,84770,"BIRTH_CERTIFICATE,DEATH_CERTIFICATE",Handles vital records
```

### 4. Using the Chat Component

Add the chat component to any page:

```tsx
import { ContactAgentChat } from "@/components/contact-agent/ContactAgentChat";

// In your component
<ContactAgentChat
  sessionContext={{
    state: "UT",
    county: "Washington",
    claimType: "DOWNWINDER"
  }}
  onContactSelected={(contact) => {
    console.log("User selected:", contact);
    // Optionally populate a form or navigate somewhere
  }}
/>
```

### 5. Test the System

1. Start your dev server:
```bash
pnpm dev
```

2. Add the chat component to a test page (e.g., create `src/app/test-contact-agent/page.tsx`)

3. Try asking:
   - "I need my birth certificate from St. George, Utah"
   - "Where can I get medical records from Las Vegas?"
   - "Help me find vital records for Washington County"

## How It Works

### 1. User asks a question

The user types a natural language query like:
> "I need my birth certificate from St. George, Utah"

### 2. AI analyzes the query

OpenAI's GPT-4 understands:
- **Document type:** Birth certificate
- **Location:** St. George, Utah (Washington County)
- **Resource type needed:** Vital Records office

### 3. AI calls the search function

Using OpenAI's function calling, it executes:
```typescript
searchContacts({
  state: "UT",
  county: "Washington",
  resourceTypes: ["VITAL_RECORDS"],
  documentTypes: ["BIRTH_CERTIFICATE"]
})
```

### 4. Results are returned

The database query returns matching DocumentResource records.

### 5. AI formats the response

GPT-4 presents the results conversationally:
> "I found the Washington County Clerk's office! They handle birth certificates for St. George..."

### 6. Contact cards displayed

The frontend shows interactive contact cards with:
- Phone, email, website
- Address and directions
- Costs and processing times
- Request method tags (online, mail, etc.)

## Adding More Contacts

### Method 1: Manual via Prisma Studio

```bash
npm run db:studio
```

Navigate to `DocumentResource` table and add entries manually.

### Method 2: Bulk Import from CSV

1. Create a CSV file with your contacts
2. Run: `npx tsx scripts/seed-contacts.ts your-contacts.csv`

### Method 3: Use Existing Scrapers

The `contact-gathering/` directory has Python scrapers:

```bash
# Run hospital scraper
python3 contact-gathering/scraper_hospitals_cms.py

# This creates a CSV file
# Then import it:
npx tsx scripts/seed-contacts.ts contact-gathering/output/hospitals.csv
```

## Database Schema

The `DocumentResource` model (already in your schema.prisma) stores:

```prisma
model DocumentResource {
  state                  String              // "UT", "NV", etc.
  county                 String?             // "Washington", "Clark"
  resourceType           ResourceType        // VITAL_RECORDS, HOSPITAL, etc.
  name                   String              // "Washington County Clerk"
  phone                  String?
  email                  String?
  website                String?
  address                String?
  documentTypesProvided  String[]            // ["BIRTH_CERTIFICATE", ...]
  estimatedCost          Float?              // 20.00
  processingTimeDays     Int?                // 10
  acceptsMailRequests    Boolean
  acceptsOnlineRequests  Boolean
  appointmentRequired    Boolean
  // ... and many more helpful fields
}
```

## Cost Analysis

### Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| OpenAI API | ~$50-100/month | GPT-4 function calling |
| PostgreSQL | $0 | Using your existing database |
| **Total** | **$50-100/month** | No Airtable/n8n/Voiceflow needed! |

### Previous External Services (Now Eliminated)
| Service | Old Cost | Status |
|---------|----------|--------|
| Airtable | $20-50/mo | ❌ Removed |
| n8n | $20-50/mo | ❌ Removed |
| Voiceflow | $50-100/mo | ❌ Removed |
| **Savings** | **$90-200/month** | 💰 |

## Security & Privacy

- ✅ All contact data in your own database
- ✅ Full control over data access
- ✅ No third-party data sharing
- ✅ Works with your existing auth system
- ✅ HIPAA-compliant infrastructure
- ✅ Audit trails via existing AuditLog system

## API Endpoints

### POST /api/contact-agent/chat
Main chat endpoint for the AI agent.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I need my birth certificate from St. George" }
  ],
  "sessionContext": {
    "state": "UT",
    "county": "Washington",
    "claimType": "DOWNWINDER"
  }
}
```

**Response:**
```json
{
  "message": "I found the Washington County Clerk's office!...",
  "contacts": [
    {
      "id": "...",
      "name": "Washington County Clerk",
      "phone": "(435) 301-7200",
      ...
    }
  ]
}
```

### POST /api/admin/resources/import
Admin-only endpoint for bulk importing contacts.

**Requires:** Admin role
**Request:**
```json
{
  "resources": [
    {
      "state": "UT",
      "county": "Washington",
      "name": "...",
      "resourceType": "VITAL_RECORDS",
      ...
    }
  ]
}
```

### GET /api/resources/search
Direct search endpoint (already exists).

**Query params:**
- `state` - State code (e.g., "UT")
- `county` - County name
- `resourceType` - Type of resource
- `documentType` - Document needed

## Customization

### Adjust AI Personality

Edit the system prompt in `src/app/api/contact-agent/chat/route.ts`:

```typescript
const systemPrompt = `You are a helpful AI assistant for RadiantClaims...`;
```

### Add New Resource Types

Update `ResourceType` enum in `schema.prisma`:

```prisma
enum ResourceType {
  VITAL_RECORDS
  HOSPITAL
  // Add new types here
  EMPLOYER_RECORDS
  MILITARY_ARCHIVES
}
```

Then run: `npm run db:push`

### Customize Chat UI

Edit `src/components/contact-agent/ContactAgentChat.tsx` to:
- Change colors/styling
- Add more contact fields
- Modify card layout
- Add action buttons

## Troubleshooting

### "OPENAI_API_KEY not found"
Add it to your `.env.local` file and restart the dev server.

### "Authentication failed against database"
Check your `DATABASE_URL` environment variable. You may need to use the Railway CLI or check credentials.

### Contacts not showing up
1. Check if they exist: `npm run db:studio`
2. Look at `DocumentResource` table
3. Verify state/county formatting (uppercase state codes)

### AI not finding contacts
The AI uses function calling. Check:
1. OpenAI API key is valid
2. Messages array is correctly formatted
3. Database has contacts matching the query

## Next Steps

1. ✅ **Populate database** - Run scrapers or import CSVs
2. ✅ **Add to intake flow** - Integrate chat in your RECA workflow
3. ✅ **Test with users** - Get feedback and refine prompts
4. ✅ **Monitor costs** - Track OpenAI API usage
5. ✅ **Expand features** - Add letter generation, form pre-filling, etc.

## Future Enhancements

### Phase 2 Ideas
- Auto-generate request letters
- Pre-fill contact forms
- Track which contacts users actually use
- A/B test different AI prompts
- Add voice interface (speech-to-text)
- Multi-language support

### Analytics to Track
- Most requested document types
- Which institutions get contacted most
- Average time to find contact
- User satisfaction ratings
- Conversion rate (chat → document request)

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Test with sample data first
4. Check OpenAI API status if agent fails

---

**Built with:** Next.js, Prisma, OpenAI, PostgreSQL
**Cost:** ~$50-100/month (vs $200+ for external tools)
**Security:** Full data ownership, HIPAA-compliant
