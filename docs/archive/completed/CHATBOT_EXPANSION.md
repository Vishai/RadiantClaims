# Project Brief: Radiant Claims Contact Agent Evolution
**Date:** November 19, 2025
**Project Phase:** Strategic Planning & Next Steps
**Status:** ✅ CURRENT STATE DOCUMENTED | 🎯 EVOLUTION PLANNING

---

## Executive Summary

RadiantClaims currently has a **WORKING, DEPLOYED AI contact agent system** that successfully implements a bifurcated user experience:
- **Free Tier:** Basic RECA eligibility chatbot (no API cost concerns - already live)
- **Paid Tier (DIY_PREP):** Full contact finder with database search + web fallback

**This document has been updated to reflect the ACTUAL current implementation**, not a hypothetical future state. The "expansion" refers to evolving this existing system further.

---

## 1. Current State Analysis (The "As-Is") ✅

### What We Have (ACTUALLY BUILT & DEPLOYED)

#### A. Two-Tier Chatbot System
**Implementation:** `FloatingContactAgent.tsx` + `ContactAgentChat.tsx` + `BasicInfoBot.tsx`

| Feature | Free Tier | Paid Tier (DIY_PREP) |
|---------|-----------|----------------------|
| **Access** | Unauthenticated users | `role: CUSTOMER` with active subscription |
| **Chatbot Type** | `BasicInfoBot` | `ContactAgentChat` |
| **API Endpoint** | `/api/contact-agent/basic-info` | `/api/contact-agent/chat` |
| **AI Features** | General RECA Q&A, eligibility checking | Full contact search with function calling |
| **Database Access** | ❌ None | ✅ DocumentResource table + web search fallback |
| **AI Cost per Chat** | ~$0.02-0.05 | ~$0.10-0.30 (includes function calls) |

**Key Files:**
- Frontend: `src/components/contact-agent/FloatingContactAgent.tsx:29` (access control)
- Free Bot: `src/components/contact-agent/BasicInfoBot.tsx`
- Paid Bot: `src/components/contact-agent/ContactAgentChat.tsx`
- Free API: `src/app/api/contact-agent/basic-info/route.ts`
- Paid API: `src/app/api/contact-agent/chat/route.ts`

#### B. Contact Search System (Paid Tier Only)
**Implementation:** OpenAI function calling + Prisma database queries

**Capabilities:**
1. **Database Search First:** Searches `DocumentResource` table by state, county, resourceType, documentType
2. **Web Fallback:** Uses Tavily API when database has no results
3. **Auto-Import:** High-quality web results (score >70) are auto-imported to database
4. **Social Proof:** Shows success rates, ratings, usage stats per contact
5. **Tracking:** Creates `ResourceInteraction` records for analytics & follow-ups

**Function Tools Available:**
- `search_contacts()` - Searches internal `DocumentResource` database
- Supports filters: state, county, resourceTypes[], documentTypes[]
- Returns: Contact cards with phone, email, address, website, stats

**Data Model:**
```prisma
DocumentResource {
  id, name, resourceType, state, county
  phone, email, website, address
  documentTypesProvided[]
  estimatedCost, processingTimeDays
  acceptsMailRequests, acceptsOnlineRequests
  stats { totalFeedback, successRate, avgRating }
}

ResourceInteraction {
  resourceId, sessionId, documentType
  shownVia: "chat_bot" | "manual_search"
  searchQuery, followUpScheduledFor
}
```

#### C. Current Service Tiers
**From:** `prisma/schema.prisma:ServiceTier`

```
enum ServiceTier {
  DIY_PREP      // $149.99 setup + $24.99/mo - Access to contact agent
  LEGAL_REP     // No upfront cost - Full legal rep (no chatbot access currently)
}
```

**Access Control Logic:**
- Free users (unauthenticated): `BasicInfoBot` only
- DIY_PREP subscribers: `ContactAgentChat` with full database access
- LEGAL_REP users: Currently same as free tier (no contact agent access)

---

## 2. Domain Context: RECA Landscape (Nov 2025 Status)

### Legislative Status ✅ ACCURATE
* **RECA Reinstated:** July 2025 expansion
* **Filing Deadline:** December 31, 2027
* **New Eligible Groups:**
    * Manhattan Project Waste Claimants (St. Louis) - $50,000
    * Expanded Downwinders/Uranium Workers - $100,000
* **DOJ Digital Portal:** Launching Dec 2025 (our chatbot must guide digital uploads)

---

## 3. Current Implementation vs. Original "Strategic Requirements"

### A. The "Bifurcated" User Journey ✅ FULLY IMPLEMENTED

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Detect user status | ✅ DONE | `FloatingContactAgent.tsx:29` checks `session?.user?.role` |
| Public/Visitor Mode | ✅ DONE | `BasicInfoBot` - eligibility quizzes, education, no contacts |
| Client/Paid Mode | ✅ DONE | `ContactAgentChat` - database search, contact cards, social proof |
| Upsell messaging | ✅ DONE | `BasicInfoBot.tsx:159-181` - upgrade banner to `/service-tiers` |

**Current Scope (Free Tier):**
- ✅ Eligibility quizzes
- ✅ RECA education
- ✅ General document types needed
- ❌ Specific contact lists (paywall)

**Current Scope (Paid Tier):**
- ✅ Find hospitals, vital records offices, schools
- ✅ Database search by location
- ✅ Web search fallback
- ✅ Social proof (success rates, ratings)
- ✅ Contact interaction tracking
- ⚠️ NOT YET: Letter generation, pathology report interpretation

### B. Technical "Guardrails" & Compliance ✅ MOSTLY IMPLEMENTED

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Anti-hallucination | ✅ DONE | System prompt enforces "may be eligible" language |
| Source of truth | ⚠️ PARTIAL | Database-first approach, but no RAG on DOJ PDFs yet |
| Sensitivity | ✅ DONE | System prompts tuned for empathy (`chat/route.ts:64-100`) |
| Scope restrictions | ✅ DONE | Both bots have clear IMPORTANT SCOPE RESTRICTIONS in prompts |

**Anti-Hallucination Measures:**
```typescript
// chat/route.ts:63-73
"You ONLY help find institutional contacts for RECA-related documents"
"If a user asks something outside your scope, politely redirect them"
"Only search for OFFICIAL INSTITUTIONS"
```

**Missing (Future Enhancement):**
- ❌ RAG system for 2025 RECA Amendment PDFs
- ❌ Legal disclaimer guardrails ("This is not legal advice")
- ❌ Audit trail for bot advice (for liability)

### C. App-Specific Guidance ❌ NOT YET IMPLEMENTED

**Original Requirement:**
> "The bot must act as a 'User Manual' for the Radiant Claims app itself."
> Example: "Where do I upload my dad's death certificate?"

**Current Status:**
- Free tier: General RECA info only
- Paid tier: Contact finder only (no app navigation guidance)

**Gap:** Neither bot can answer "How do I use this app?" questions

---

## 4. AI Cost Analysis for Free Users 💰

### Current Costs (Per Conversation)

**Free Tier (`BasicInfoBot`):**
- Model: GPT-4 Turbo (via `CONTACT_AGENT_MODEL`)
- Average tokens: ~1,500 input + 600 output per exchange
- Cost per message: ~$0.02-0.05
- **Monthly estimate (100 free users, 3 messages avg):** $6-15/month

**Paid Tier (`ContactAgentChat`):**
- Same model + function calling overhead
- Average tokens: ~2,000 input + 800 output + function results
- Cost per message: ~$0.10-0.30
- **Monthly estimate (50 paid users, 5 messages avg):** $25-75/month

### Cost Mitigation Strategies (ALREADY IN PLACE)

✅ **Bifurcated access** - Free tier has limited scope (fewer tokens)
✅ **No database access for free** - Prevents expensive web searches
✅ **Token limits** - Free: 800 max tokens, Paid: 1000 max tokens
✅ **Paywall incentive** - Free users get upgrade prompts

### ⚠️ ONBOARDING CHATBOT CONCERN (YOUR QUESTION)

**Your Note:**
> "I don't want to incur AI API cost for free users, so if we have a chatbot in the onboarding stage we really need to evaluate how to do that..."

**Current Situation:**
- ✅ Free chatbot (`BasicInfoBot`) is ALREADY live and does incur small AI costs (~$0.02-0.05/chat)
- ✅ Costs are minimal because it's scoped to basic Q&A, no function calling, no database queries
- ⚠️ If onboarding = "guest users before signup", they currently get `BasicInfoBot`

**Options to Reduce/Eliminate Free Tier AI Costs:**

1. **Option A: Rule-Based Onboarding Bot (No AI)**
   - Replace `BasicInfoBot` with a decision-tree chatbot (no OpenAI calls)
   - Tools: Landbot, Typeform, or custom React flow
   - Pros: $0 AI cost, predictable answers
   - Cons: Can't handle complex/nuanced questions
   - Effort: ~20 hours to build

2. **Option B: Hybrid (AI Only for Paid Users)**
   - Remove `BasicInfoBot` entirely
   - Free users get static FAQ page instead
   - Only DIY_PREP subscribers get AI chatbot
   - Pros: $0 free tier cost, clear value prop
   - Cons: Less engagement from free users
   - Effort: ~2 hours (remove component, add FAQ)

3. **Option C: Rate-Limited Free AI**
   - Keep `BasicInfoBot` but limit to 3 questions per session
   - Add "Sign up to continue chatting" after limit
   - Pros: Balances engagement + cost control
   - Cons: Still some AI cost, adds complexity
   - Effort: ~5 hours (add rate limiting)

4. **Option D: Cached Responses (Smart)**
   - Pre-generate answers to common questions
   - Only call OpenAI for novel queries
   - Store Q&A pairs in Redis/database
   - Pros: 70-80% cost reduction after warmup
   - Cons: Cache management complexity
   - Effort: ~15 hours (build caching layer)

**Recommendation:**
- **Short-term:** Option C (rate limiting) - balances cost + UX
- **Long-term:** Option D (caching) - best ROI as user base grows

---

## 5. Key Questions for Implementation Plan (UPDATED)

### Original Questions (From Gemini 3 Prompt)
❌ ~~Should we use a single agent with context switching or two distinct agents?~~
**ANSWER:** Already decided - two distinct agents (`BasicInfoBot` + `ContactAgentChat`)

❌ ~~What is the RAG strategy for ingesting the 2025 RECA Amendment PDFs?~~
**ANSWER:** Not yet implemented. See Section 6B below for recommendation.

❌ ~~How do we audit the bot's advice for legal liability?~~
**ANSWER:** Not yet implemented. Currently no logging of AI responses for legal review.

### NEW Questions (Based on Current Implementation)

1. **Should we expand BasicInfoBot capabilities without breaking the paywall?**
   - Current: Very limited free tier
   - Risk: Too generous = no conversions, too restrictive = bad UX
   - Decision needed: What's the optimal free tier scope?

2. **Should LEGAL_REP subscribers get chatbot access?**
   - Current: They pay MORE but get LESS (no contact agent)
   - Options:
     - Give them ContactAgentChat access (fair)
     - Give them enhanced bot with attorney handoff (premium)
     - Keep as-is (their value is legal rep, not tools)

3. **How do we prevent free users from gaming the system?**
   - Current: No rate limiting on BasicInfoBot
   - Risk: Users abuse free tier with unlimited questions
   - Solutions: Session limits, IP throttling, require email signup

4. **Should we build the "app navigation" bot mentioned in Section 3C?**
   - Current: Users ask chatbot "Where do I upload documents?" and bot can't answer
   - Solution: Third bot type for UI guidance? Or expand BasicInfoBot scope?

---

## 6. Evolution Roadmap (Next Steps)

### Phase 1: Cost Optimization & Analytics (1-2 weeks)
**Goal:** Reduce free tier costs and measure current effectiveness

- [ ] Implement rate limiting on `BasicInfoBot` (3 questions/session for anon users)
- [ ] Add analytics tracking: conversation completion rate, upgrade conversion rate
- [ ] Build response caching for common RECA questions
- [ ] Add legal disclaimer to both bots ("Not legal advice, educational only")
- [ ] Create admin dashboard to monitor AI spending per tier

**Files to Modify:**
- `src/app/api/contact-agent/basic-info/route.ts` - Add rate limiting
- `src/components/contact-agent/BasicInfoBot.tsx` - Show "X questions remaining"
- New: `src/lib/chatbot-cache.ts` - Response caching layer

### Phase 2: Enhanced Paid Features (2-3 weeks)
**Goal:** Increase value of DIY_PREP tier to justify AI costs

- [ ] Letter generation for document requests (already mentioned in CONTACT_AGENT_BLUEPRINT.md)
- [ ] HIPAA authorization form generation
- [ ] Follow-up email tracking integration (already built: `ResourceInteraction.followUpScheduledFor`)
- [ ] "Save contact for later" feature in UI
- [ ] Export conversation history (PDF/email)

**New API Endpoint:**
- `POST /api/contact-agent/generate-letter` - Creates personalized request letter

### Phase 3: RAG Implementation for RECA Statute (3-4 weeks)
**Goal:** Make chatbot cite official DOJ sources, reduce hallucinations

**Architecture:**
```
1. Ingest DOJ RECA PDFs → Text extraction (pdf-parse or Docling)
2. Chunk + Embed → Vector DB (Pinecone, pgvector, or Supabase)
3. Search → Retrieve relevant sections on each query
4. Augment → Pass to GPT-4 as context: "Base your answer on this official text"
```

**Example User Flow:**
```
User: "Are Downwinders in Idaho eligible?"
Bot:
  1. Searches vector DB for "Idaho downwinder eligibility"
  2. Retrieves: "42 U.S.C. § 2210 note - Idaho is NOT in designated downwinder counties"
  3. Responds: "Based on the RECA statute (42 U.S.C. § 2210), Idaho is not currently
     designated as a downwinder area. However, the 2025 expansion may include new
     counties - check with DOJ for updates."
```

**Cost Impact:**
- Vector DB: ~$20-50/month (Pinecone Starter or pgvector self-hosted)
- Embedding costs: ~$5-10 one-time (embed PDFs)
- Query latency: +200-500ms per chat

**Files:**
- New: `src/lib/rag/` - Embedding pipeline, vector search
- Modify: `src/app/api/contact-agent/chat/route.ts` - Inject RAG context

### Phase 4: App Navigation Bot (1-2 weeks)
**Goal:** Help users use the RadiantClaims platform itself

**New Bot Type:** `AppGuideBot` (optional third tier, or expand BasicInfoBot)

**Example Queries:**
- "Where do I upload my birth certificate?"
  → "Go to Documents tab > Click blue '+' button > Select 'Vital Records'"
- "How do I check my claim status?"
  → "Navigate to Dashboard > Claim Timeline section shows your progress"
- "How do I contact support?"
  → "Click 'Help' in the top nav, or email support@radiantclaims.com"

**Implementation:**
- Use GPT-4 function calling with app sitemap/structure as context
- No database queries needed (just app navigation metadata)
- Could be FREE tier feature (low cost, high value)

**Pros:**
- Reduces support burden
- Improves user retention (less confusion)
- Minimal AI cost (simple queries, small context)

**Cons:**
- Maintenance burden (update when UI changes)
- Might be overkill if app is intuitive enough

---

## 7. Free vs. Paid Tier Philosophy (DECISION NEEDED)

### Current State
**Free Tier (`BasicInfoBot`):**
- ✅ What RECA is
- ✅ Eligibility checking
- ✅ General document types needed
- ❌ Specific contacts

**Paid Tier (`ContactAgentChat`):**
- ✅ Find specific contacts (hospitals, offices)
- ✅ Database search + web fallback
- ✅ Social proof & stats
- ❌ Letter generation (future)

### Proposed Evolution

**Option A: Keep Free Tier Minimal (Current Approach)**
- Free = Education only, no actionable results
- Paid = Contact finder + tools
- **Conversion strategy:** "Want contacts? Upgrade!"
- **Risk:** High bounce rate from free users

**Option B: Generous Free Tier (Lead Gen Model)**
- Free = Everything except letter generation & advanced tools
- Free users can search contacts BUT:
  - See blurred contact info ("Upgrade to reveal phone/email")
  - Limited to 3 contact searches per week
  - No social proof stats shown
- **Conversion strategy:** "Unlock full contact details for $24.99/mo"
- **Risk:** Higher AI costs, but more conversions

**Option C: Freemium with Credits**
- Free tier gets 10 "credits" per month
- Each contact search = 3 credits
- Each letter generation = 5 credits
- **Conversion strategy:** "Buy more credits or subscribe for unlimited"
- **Risk:** Complexity of credit tracking system

**Recommendation:**
- Start with **Option A** (current approach) to validate demand
- If conversion rate is low (<5%), switch to **Option B** (lead gen)
- Avoid **Option C** initially (too complex for MVP)

---

## 8. Technical Debt & Improvements

### Current Implementation Gaps

1. **No Legal Audit Trail**
   - Problem: Can't review what bot told users (liability risk)
   - Solution: Log all AI responses to `ChatbotConversation` table
   - Effort: ~5 hours

2. **No Rate Limiting**
   - Problem: Free users can spam API, driving up costs
   - Solution: Redis-based rate limiting (10 requests/hour for anon)
   - Effort: ~8 hours

3. **No Response Caching**
   - Problem: Same questions hit OpenAI every time
   - Solution: Cache frequent Q&A pairs (Redis or DB)
   - Effort: ~12 hours

4. **No A/B Testing**
   - Problem: Can't optimize system prompts scientifically
   - Solution: Track prompt variants, measure conversion rates
   - Effort: ~15 hours

5. **No Feedback Loop**
   - Problem: Don't know if bot answers are helpful
   - Solution: Add 👍👎 buttons, log feedback to improve prompts
   - Effort: ~10 hours (already partially exists for contacts via `ResourceFeedbackInline`)

---

## 9. Cost Projections (6-Month Forecast)

### Assumptions
- 500 free users/month (avg 3 chats each)
- 100 paid users/month (avg 5 chats each)
- GPT-4 Turbo pricing: $10/1M input tokens, $30/1M output tokens

### Current Architecture (No Optimizations)
| Tier | Users | Chats | Cost/Chat | Monthly Cost |
|------|-------|-------|-----------|--------------|
| Free | 500 | 1,500 | $0.03 | $45 |
| Paid | 100 | 500 | $0.15 | $75 |
| **TOTAL** | | | | **$120/month** |

### With Optimizations (Caching + Rate Limiting)
| Tier | Users | Chats | Cost/Chat | Monthly Cost |
|------|-------|-------|-----------|--------------|
| Free | 500 | 1,000 (limited) | $0.01 (70% cached) | $10 |
| Paid | 100 | 500 | $0.10 (30% cached) | $50 |
| **TOTAL** | | | | **$60/month** |

**ROI:**
- Cost reduction: 50% (~$60/month savings)
- Revenue impact: If chatbot drives just 5 extra DIY_PREP signups/month → +$125/month
- **Net benefit:** +$185/month

---

## 10. Recommendation Summary

### Immediate Actions (This Week)
1. ✅ **Accept current BasicInfoBot costs** (~$45/month is negligible)
2. 🔧 **Add rate limiting** to prevent abuse (3 chats/session for anon users)
3. 📊 **Add analytics** to measure:
   - Free → Paid conversion rate
   - Most common questions (to optimize caching)
   - Drop-off points (where users give up)

### Short-Term (1 Month)
1. 🎯 **Build response caching** for 20 most common RECA questions
2. 📝 **Add legal disclaimer** to both bots ("Educational only, not legal advice")
3. 🔍 **Grant LEGAL_REP users** access to ContactAgentChat (they paid more, deserve access)

### Medium-Term (3 Months)
1. 📄 **Letter generation** for DIY_PREP tier (big value add)
2. 🧠 **RAG implementation** for DOJ RECA statute (reduce hallucinations)
3. 🗺️ **App navigation bot** (reduce support burden)

### Long-Term (6 Months)
1. 🤖 **Multi-agent orchestration** - Automatically route questions to best bot:
   - RECA info → BasicInfoBot
   - Contact search → ContactAgentChat
   - App navigation → AppGuideBot
   - Legal questions → Handoff to attorney
2. 📞 **Voice interface** (Whisper API) for elderly users
3. 🌐 **Multilingual support** (Spanish priority for Southwestern downwinders)

---

## 11. Final Assessment

### What's Working ✅
- ✅ Bifurcated access control (free vs. paid)
- ✅ Contact search with database + web fallback
- ✅ Social proof integration (stats, ratings)
- ✅ Interaction tracking for follow-ups
- ✅ Empathetic, well-tuned system prompts

### What's Missing ⚠️
- ⚠️ RAG for DOJ statute (risk of hallucinations)
- ⚠️ Legal audit trail (liability risk)
- ⚠️ Rate limiting (cost risk)
- ⚠️ Response caching (efficiency)
- ⚠️ Letter generation (promised but not built)

### Risk Assessment
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Free tier cost explosion | High | Medium | Rate limiting + caching |
| Bot gives wrong legal advice | Critical | Low | RAG + disclaimers + audit logs |
| Low free → paid conversion | High | Medium | A/B test upsell messaging |
| Users abuse free tier | Medium | High | Session limits, require signup |
| LEGAL_REP users feel shortchanged | Medium | Medium | Grant them chatbot access |

---

## Appendix: Current File Reference

### Frontend Components
- `src/components/contact-agent/FloatingContactAgent.tsx` - Main wrapper, access control
- `src/components/contact-agent/BasicInfoBot.tsx` - Free tier bot
- `src/components/contact-agent/ContactAgentChat.tsx` - Paid tier bot
- `src/components/contact-agent/ResourceFeedbackInline.tsx` - Contact rating system

### API Routes
- `src/app/api/contact-agent/basic-info/route.ts` - Free tier endpoint
- `src/app/api/contact-agent/chat/route.ts` - Paid tier endpoint (with function calling)

### Library Functions
- `src/lib/contact-agent/search.ts` - Database contact search
- `src/lib/contact-agent/web-search.ts` - Tavily web search fallback
- `src/lib/contact-agent/auto-import.ts` - Auto-import web results to DB

### Database Models
- `prisma/schema.prisma` - `DocumentResource`, `ResourceInteraction`, `ServiceSubscription`

### Documentation
- `contact-agent/CONTACT_AGENT_BLUEPRINT.md` - Original implementation plan (now outdated)
- `FLOATING_CONTACT_AGENT.md` - Deployment guide
- `RESOURCE_HUB_AND_TRACKING_PLAN.md` - Contact tracking system
- `WEB_SEARCH_INTEGRATION.md` - Web search fallback details

---

**Next Step:** Review this updated document and decide which Phase 1-4 items to prioritize. Focus on ROI (cost reduction + conversion improvement).
