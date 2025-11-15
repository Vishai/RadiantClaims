# Contact Agent - Technical Blueprint

## Overview

An AI-powered contact agent that helps claimants find the right institutions and guides them through the document retrieval process by:
1. Searching your internal ResourceContacts database
2. Web searching when needed to find additional contacts
3. Providing step-by-step guidance on requesting documents
4. Auto-generating request letters with proper releases

---

## Difficulty Assessment

### 🟢 **EASY Components (1-2 weeks)**
- Basic chatbot interface (embedded on website)
- Airtable integration (read ResourceContacts)
- Simple Q&A about RECA eligibility
- Template-based responses
- Static contact lookups

### 🟡 **MODERATE Components (2-4 weeks)**
- Context-aware conversation flow
- Dynamic contact searches (by location, institution type)
- Web search integration for missing contacts
- User session management
- Document request letter generation

### 🔴 **ADVANCED Components (4-8 weeks)**
- Multi-turn conversation with memory
- OCR integration (user uploads old documents)
- Intelligent contact recommendations
- Auto-population of forms from conversation
- Integration with e-signature workflow
- Live data sync with Airtable

---

## Architecture Options

### Option 1: **Simple Chatbot** (Easiest - 1 week)
**Difficulty:** 🟢 Low
**Cost:** ~$50/month
**Time to Build:** 40-60 hours

**Stack:**
- Frontend: Landbot, Typeform Conversational, or Tawk.to
- Backend: n8n webhooks + Airtable
- Logic: Decision tree / rule-based

**Capabilities:**
- "What county did you live in?" → Searches ResourceContacts
- "I need a birth certificate" → Returns county vital records office
- "How do I request medical records?" → Shows template letter
- Basic only, no AI reasoning

**Pros:** Fast, cheap, reliable
**Cons:** Can't handle complex queries, no learning

---

### Option 2: **AI-Powered Assistant** (Moderate - 2-3 weeks)
**Difficulty:** 🟡 Moderate
**Cost:** ~$200/month
**Time to Build:** 80-120 hours

**Stack:**
- Frontend: Custom React widget or Voiceflow
- AI: OpenAI GPT-4 or Anthropic Claude API
- Backend: n8n + Airtable
- Tools: Langchain for orchestration

**Capabilities:**
- Natural language understanding: "I lived in St. George in the 50s"
- Intelligent contact search across Airtable
- Web search fallback when contact not in database
- Context retention across conversation
- Generates personalized request letters
- Explains RECA eligibility conversationally
- Handles edge cases: "What if the school closed?"

**Pros:** Smart, conversational, handles complexity
**Cons:** More expensive, requires AI expertise

---

### Option 3: **Full Agent Platform** (Advanced - 6-8 weeks)
**Difficulty:** 🔴 High
**Cost:** ~$500/month
**Time to Build:** 240-320 hours

**Stack:**
- Frontend: Custom React app with real-time chat
- AI: Claude/GPT-4 with function calling
- Backend: Node.js/Python API
- Database: PostgreSQL + Airtable sync
- Tools: Vector database for semantic search
- Integration: DocuSign, n8n, email/SMS

**Capabilities:**
- Everything from Option 2, PLUS:
- OCR document analysis ("upload your old utility bill")
- Intelligent form auto-fill from conversation
- Multi-modal (text, voice, document upload)
- Proactive guidance: "You mentioned you had leukemia - we'll need X, Y, Z"
- Direct e-signature initiation
- Case status tracking
- Handoff to attorney review

**Pros:** White-glove experience, full automation
**Cons:** Expensive, complex, longer build time

---

## Recommended Approach: **Hybrid MVP** (2-3 weeks)

Build a **Moderate AI Assistant** with phased rollout:

### Phase 1: Core Chat (Week 1)
- Embedded chatbot on website
- GPT-4 with custom instructions about RECA
- Airtable contact lookups
- Basic conversation flow

### Phase 2: Intelligence (Week 2)
- Web search integration for missing contacts
- Generate request letter templates
- Session memory (remembers earlier answers)
- County/state recommendations

### Phase 3: Automation (Week 3)
- Auto-populate intake form from chat
- Trigger e-signature workflows
- Email request letters to claimant
- Save conversation to Airtable

---

## Technical Implementation

### Core Components:

#### 1. **Frontend Widget** (Easiest: Voiceflow, Custom: React)

**Voiceflow Embed (Recommended for MVP):**
```html
<script type="text/javascript">
  (function(d, t) {
    var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = function() {
      window.voiceflow.chat.load({
        verify: { projectID: 'YOUR_PROJECT_ID' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production'
      });
    }
    v.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
    v.type = "text/javascript";
    s.parentNode.insertBefore(v, s);
  })(document, 'script');
</script>
```

**Custom React Widget:**
```jsx
import { ChatWidget } from '@/components/chat';

function App() {
  return (
    <ChatWidget
      apiEndpoint="https://api.radiantclaims.com/chat"
      airtableBase="YOUR_BASE_ID"
    />
  );
}
```

---

#### 2. **AI Backend** (Claude/GPT-4 with Tools)

**Using OpenAI Function Calling:**
```python
import openai
from airtable import Airtable

# Initialize
client = openai.OpenAI(api_key=OPENAI_KEY)
airtable = Airtable(base_id, 'ResourceContacts', api_key=AIRTABLE_KEY)

# Define tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_contacts",
            "description": "Search ResourceContacts table for institutions",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {"type": "string"},
                    "county": {"type": "string"},
                    "institution_type": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search_contact",
            "description": "Search web for institution not in database",
            "parameters": {
                "type": "object",
                "properties": {
                    "institution_name": {"type": "string"},
                    "location": {"type": "string"}
                }
            }
        }
    }
]

def search_contacts(state, county, institution_type):
    """Query Airtable for matching contacts"""
    formula = f"AND({{State}}='{state}', {{County}}='{county}', {{InstitutionType}}='{institution_type}')"
    results = airtable.search(formula=formula)
    return results

def web_search_contact(institution_name, location):
    """Fallback to web search"""
    from googlesearch import search
    query = f"{institution_name} {location} contact phone address"
    results = list(search(query, num_results=3))
    return results

# Chat loop
def chat_with_agent(user_message, conversation_history):
    messages = conversation_history + [
        {"role": "user", "content": user_message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    # Handle tool calls
    if response.choices[0].message.tool_calls:
        for tool_call in response.choices[0].message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            if function_name == "search_contacts":
                result = search_contacts(**function_args)
            elif function_name == "web_search_contact":
                result = web_search_contact(**function_args)
            
            # Add function result back to conversation
            messages.append({
                "role": "function",
                "name": function_name,
                "content": json.dumps(result)
            })
    
    return response.choices[0].message.content
```

---

#### 3. **Airtable Integration**

**Read from ResourceContacts:**
```python
from airtable import Airtable

table = Airtable(base_id, 'ResourceContacts', api_key=key)

# Search by county
def find_vital_records_office(state, county):
    formula = f"AND({{State}}='{state}', {{County}}='{county}', {{InstitutionType}}='County Office')"
    records = table.search(formula=formula)
    
    if records:
        contact = records[0]['fields']
        return {
            'name': contact.get('InstitutionName'),
            'phone': contact.get('Phone'),
            'email': contact.get('Email'),
            'address': contact.get('Address'),
            'website': contact.get('Website'),
            'request_method': contact.get('RequestMethod')
        }
    return None
```

**Write to Conversations table:**
```python
conversations_table = Airtable(base_id, 'Conversations', api_key=key)

def save_conversation(claimant_id, messages, outcome):
    conversations_table.insert({
        'ClaimantID': [claimant_id],
        'Timestamp': datetime.now().isoformat(),
        'Messages': json.dumps(messages),
        'Outcome': outcome,  # "Contact Found", "Letter Generated", etc.
        'ContactsProvided': ["rec123", "rec456"]  # Links to ResourceContacts
    })
```

---

#### 4. **System Prompt** (The Magic)

```python
SYSTEM_PROMPT = """You are a helpful RECA claims assistant for RadiantClaims.

Your job is to help claimants:
1. Understand RECA eligibility
2. Find institutions that hold their records (1951-1962)
3. Guide them through requesting documents

You have access to:
- ResourceContacts database (county offices, hospitals, schools, churches)
- Web search (for contacts not in database)
- Request letter templates

CRITICAL RULES:
- Always search internal database FIRST before web search
- For county vital records: always check ResourceContacts
- For hospitals: check if they existed 1951-1962
- For schools: many closed/consolidated - check "RecordsLocation" field
- Be empathetic - many claimants are elderly or ill

CONVERSATION FLOW:
1. Gather: State, County, Years of Residence (1951-1962)
2. Identify: What documents they need (birth cert, medical, school, etc.)
3. Search: Find contacts in database or web
4. Provide: Contact info + request guidance
5. Generate: Personalized request letter if needed

When you find a contact, provide:
- Institution name
- Phone number
- Email (if available)
- Address
- Best request method (mail, phone, online portal)
- Any special notes (e.g., "requires notarized release")

If contact not in database, offer to search web.
If contact is closed/merged, provide where records transferred.

Example interaction:
User: "I need my birth certificate from St. George, Utah"
You: [search_contacts(state="Utah", county="Washington", institution_type="County Office")]
You: "I found the Washington County Clerk's office. They handle birth certificates for St. George. 
Contact: (435) 301-7200, [email protected]
Address: 111 E Tabernacle St, St George UT 84770
Best method: You can request by mail or in person. Would you like me to generate a request letter?"

Be conversational, helpful, and thorough."""
```

---

## User Flow Examples

### Example 1: Finding Birth Certificate
```
User: I need my birth certificate. I was born in Las Vegas in 1952.

Agent: I can help you with that! Let me find the right office.
       [Searches ResourceContacts: State=Nevada, County=Clark, Type=County Office]
       
       Great news - I found the Clark County Recorder's office. They handle 
       birth certificates from 1909 onwards.
       
       Contact Information:
       • Phone: (702) 759-1010
       • Email: [email protected]
       • Address: 500 S Grand Central Pkwy, Las Vegas NV 89155
       • Website: https://www.clarkcountynv.gov/
       
       They have an online portal, which is the fastest option. Would you like 
       me to generate a request letter, or would you prefer to use their online system?

User: Generate the letter please

Agent: Perfect! I'll need a few details:
       • Your full name at birth
       • Exact date of birth (MM/DD/YYYY)
       • Parent names (if known)
       • Current mailing address
       
       [Collects info, generates letter, emails to claimant]
```

### Example 2: Finding Medical Records (Hospital Closed)
```
User: I had surgery at Southern Nevada Memorial Hospital in 1958

Agent: Let me search for that hospital...
       [Searches ResourceContacts: InstitutionName contains "Southern Nevada Memorial"]
       
       I found a note about Southern Nevada Memorial Hospital - it merged with 
       Sunrise Hospital in 1971. Their medical records from the 1950s were transferred.
       
       You'll want to contact:
       Sunrise Hospital Medical Records
       • Phone: (702) 731-8000
       • Address: 3186 S Maryland Pkwy, Las Vegas NV 89109
       • Request method: Mail with HIPAA authorization
       
       Important: Specify you need records from "Southern Nevada Memorial Hospital, 1958"
       
       Would you like me to generate the HIPAA authorization form and request letter?
```

### Example 3: Web Search Fallback
```
User: I went to Lincoln Elementary School in Tonopah, Nevada in 1955

Agent: Let me check our database for Tonopah schools...
       [Searches ResourceContacts: County=Nye, InstitutionType=School, Name contains "Lincoln"]
       
       I don't have Lincoln Elementary in our database yet. Let me search the web...
       [Web search: "Lincoln Elementary Tonopah Nevada records"]
       
       I found that Lincoln Elementary closed in 1982 and its records were 
       transferred to the Nye County School District.
       
       Contact:
       Nye County School District
       • Phone: (775) 727-7716
       • Address: 101 Radar Rd, Tonopah NV 89049
       
       When you call, ask for the "Records Department" and mention you need 
       attendance records from Lincoln Elementary, 1955.
       
       Would you like me to save this contact to our database for future claimants?
```

---

## Cost Breakdown

### Option 2: AI-Powered Assistant (Recommended)

**Monthly Recurring:**
- OpenAI API (GPT-4): ~$100-150/month (500-1000 conversations)
- Voiceflow/ChatWidget hosting: ~$50/month
- n8n automation: ~$20/month (self-hosted) or $50 (cloud)
- Airtable: $20/month (Pro plan)
**Total:** ~$200-250/month

**One-time Development:**
- Frontend integration: 20 hours
- Backend API: 40 hours
- Airtable integration: 15 hours
- System prompt engineering: 10 hours
- Testing & refinement: 15 hours
**Total:** 100 hours (~$8,000 at $80/hr, or 2-3 weeks DIY)

---

## MVP Roadmap (3 Weeks)

### Week 1: Foundation
- [ ] Choose platform (Voiceflow vs custom)
- [ ] Set up OpenAI/Claude API
- [ ] Connect to Airtable ResourceContacts
- [ ] Write system prompt
- [ ] Test basic Q&A

### Week 2: Intelligence
- [ ] Implement function calling (search_contacts)
- [ ] Add web search fallback
- [ ] Build letter generation
- [ ] Session memory
- [ ] Test with real scenarios

### Week 3: Polish & Deploy
- [ ] UI/UX refinement
- [ ] Error handling
- [ ] Analytics tracking
- [ ] Embed on website
- [ ] User testing
- [ ] Go live!

---

## Success Metrics

Track these to measure effectiveness:

- **Conversation completion rate** (% who get answer)
- **Contact resolution rate** (% found in database vs web search)
- **Letter generation rate** (% who request auto-generated letters)
- **Conversion to intake** (% who start full claim process)
- **User satisfaction** (CSAT score)
- **Database coverage** (% queries answered from ResourceContacts)

**Goal:** 80%+ queries resolved without human intervention

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI hallucinates contacts | High | Strict function calling, verify sources |
| Database gaps | Medium | Web search fallback + human review |
| Cost overruns | Low | Set API usage limits, cache responses |
| Privacy concerns | High | No PII storage, encrypted conversations |
| User frustration | Medium | Clear escalation path to human |

---

## Alternative: No-Code Option

If you want something FASTER with ZERO coding:

### **Voiceflow + n8n + Airtable** (1 week)

**Voiceflow:** Visual chatbot builder
- Drag-and-drop conversation design
- Built-in AI integration
- Custom functions via API

**n8n:** Connects Voiceflow to Airtable
- Receives chat queries
- Searches ResourceContacts
- Returns results to Voiceflow

**Airtable:** Your database
- Already have ResourceContacts

**Total setup:** 20-30 hours, ~$100/month

**Tutorial:**
1. Create Voiceflow project
2. Design conversation flow
3. Add "API" blocks that call n8n webhooks
4. n8n searches Airtable
5. Returns data to Voiceflow
6. Voiceflow shows to user

**Pros:** No coding, visual, fast
**Cons:** Less flexible than custom

---

## Recommendation

**Build Option 2 (AI-Powered Assistant) using Voiceflow + n8n + OpenAI**

**Why:**
- ✅ Fast to build (2-3 weeks)
- ✅ Moderate cost ($200/month)
- ✅ Actually intelligent (GPT-4)
- ✅ Integrates with existing stack
- ✅ Can evolve to Option 3 later
- ✅ No coding required (mostly)

**Start with:**
1. This week: Voiceflow + Airtable integration
2. Next week: Add OpenAI function calling
3. Week 3: Web search fallback + letter generation

**ROI:**
- Reduces support burden (answers 80% of contact questions)
- Improves conversion (easier to find contacts = more claims filed)
- Enhances UX (24/7 availability, instant answers)
- Builds database (learns from web searches)

---

Want me to build you the MVP version? I can:
1. Create Voiceflow conversation flows
2. Build n8n workflows for Airtable integration
3. Write OpenAI function definitions
4. Create system prompt
5. Set up letter generation templates

Just say the word! 🚀
