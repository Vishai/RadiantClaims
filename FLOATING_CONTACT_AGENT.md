# Floating Contact Agent Widget

## Overview

A **persistent chat widget** in the bottom-right corner of your app with **two tiers**:

1. **Free Tier (Basic Info Bot)** - Available to all users, helps with RECA eligibility and general information
2. **Paid Tier (Resource Assistant)** - Available to paid customers only, helps find institutional contacts for documents

The system automatically switches between tiers based on user authentication and subscription status.

## Features

### Common Features (Both Tiers)
✅ **Always Available** - Floating button in bottom-right corner
✅ **Minimizable** - Users can minimize/expand as needed
✅ **Smart Prompting** - Redirects off-topic questions
✅ **Context-Aware** - Adapts to user's subscription level

### Free Tier Features
✅ **Eligibility Check** - Helps determine if user qualifies for RECA
✅ **Program Information** - Explains what RECA is and how it works
✅ **Document Overview** - Lists general document requirements
✅ **Upgrade Prompts** - Encourages users to sign up for full access

### Paid Tier Features (CUSTOMER role)
✅ **Contact Search** - Finds institutional contacts (hospitals, vital records, etc.)
✅ **Web Search Fallback** - Automatically searches web if database has no results
✅ **Auto-Import** - Saves good web results to database
✅ **Full Access** - No limitations on search capabilities

## How It Works

### Free Tier Flow
1. **User clicks floating chat button** (bottom-right corner)
2. **Chat widget opens** with RECA Info Assistant (terracotta theme)
3. **User asks:** "Am I eligible for RECA if I lived in St. George in 1955?"
4. **AI provides eligibility information** and general guidance
5. **Upgrade banner shown** encouraging user to sign up for contact search
6. **User can ask** about RECA, eligibility, documents needed, etc.

### Paid Tier Flow
1. **User clicks floating chat button** (bottom-right corner)
2. **Chat widget opens** with Contact Finder (blue theme)
3. **User asks:** "I need birth certificate from Tooele County, Utah"
4. **AI searches database first**
   - If found → Returns contact ✅
   - If NOT found → Searches web via Tavily
5. **Web results auto-imported** to database (if quality score 70+)
6. **Next time:** Found in database instantly!

## Scope Restrictions

### Free Tier Scope
The **Basic Info Bot** is scoped to:

✅ **What It Helps With:**
- RECA eligibility questions
- Understanding what RECA is
- General document requirements overview
- Basic claims process information
- Downwinder/Onsite/Uranium worker categories

❌ **What It Won't Do:**
- Search for specific contacts
- Provide phone numbers or addresses
- Access contact databases
- Perform web searches

**Example redirect:**
```
User: "Where can I get my birth certificate in Utah?"
Bot: "I'm the free-tier assistant and can only help with general RECA
information. To get help finding specific contacts for documents,
you'll need to upgrade to our paid service tier. Would you like to
know more about upgrading?"
```

### Paid Tier Scope
The **Resource Assistant** is scoped to institutional contacts:

✅ **What It Helps With:**
- Birth certificates → Vital records offices
- Death certificates → County clerks
- Medical records → Hospitals, clinics
- School records → School districts
- Employment records → Former employers
- Church records → LDS, Catholic, Protestant churches
- Residence proof → County assessors, utilities

❌ **What It Won't Do:**
- General web search
- Unrelated questions
- Personal contact searches
- Non-institutional queries

**Example redirect:**
```
User: "What's the weather in Utah?"
Agent: "I'm specifically designed to help you find institutional contacts
(vital records offices, hospitals, schools, etc.) for your RECA claim.
For other questions, please contact our support team."
```

## Where It Appears

### Shows On:
- Home page
- Resources page
- Portal pages
- RECA workflow pages
- All authenticated pages

### Hidden On:
- `/login`
- `/signup`
- `/auth/*`
- API routes

## Usage Example

**User Journey:**

1. User is on `/resources` page
2. Clicks floating chat button (blue circle with message icon)
3. Types: "I need a marriage certificate from Tooele County"
4. Agent responds:
   ```
   I'll help you find the right office for a marriage certificate
   in Tooele County, Utah. Let me search...

   [Searches database → Not found]
   [Searches web via Tavily → Found!]

   I found the Tooele County Clerk's office! They handle marriage
   certificates.

   Contact Information:
   - Phone: (435) 843-3148
   - Website: https://tooeleco.org/clerk
   - Address: 47 S Main St, Tooele, UT 84074

   Note: This information was found via web search and should be
   verified. The contact has been saved to our database for future
   reference.

   Would you like help with anything else?
   ```

5. Contact is auto-imported to database (if score 70+)
6. Next user asking about Tooele County → Instant database result!

## Customization

### Change Position

In `FloatingContactAgent.tsx`:

```tsx
// Bottom-right (default)
<div className="fixed bottom-6 right-6 z-50">

// Bottom-left
<div className="fixed bottom-6 left-6 z-50">

// Top-right
<div className="fixed top-6 right-6 z-50">
```

### Change Size

```tsx
// Larger
<Card className="w-[500px] h-[700px]">

// Smaller
<Card className="w-80 h-[500px]">
```

### Change Colors

```tsx
// Different button color
<Button className="bg-green-600 hover:bg-green-700">

// Different header color
<div className="bg-purple-600 text-white">
```

### Hide on Specific Pages

In `providers.tsx`:

```tsx
const hideOnPages = [
  "/login",
  "/signup",
  "/auth",
  "/admin", // Add admin pages
  "/attorney", // Add attorney pages
];
```

## Testing

1. **Start dev server:**
```bash
pnpm dev
```

2. **Visit any page** (e.g., http://localhost:3000)

3. **Click the floating chat button** (bottom-right)

4. **Try these queries:**
   - "I need birth certificate from St. George, Utah"
   - "Hospital medical records in Las Vegas"
   - "Marriage certificate from Tooele County"
   - "School records from 1955"

5. **Try off-topic query:**
   - "What's the weather?"
   - "Tell me a joke"
   - → Should redirect to scope

## Monitoring

Check console logs for:

```
[Contact Agent] No database results, trying web search...
[Auto-Import] Created: 1, Updated: 0, Skipped: 0
```

This shows:
- When web search activates
- Which contacts get auto-imported
- Quality scores and decisions

## Cost Optimization

The floating agent is cost-effective because:

1. **Database-first** - 90% of queries hit database ($0)
2. **Web search fallback** - Only when needed (~$0.001/search)
3. **Auto-import** - Reduces future web searches
4. **Scoped prompts** - Prevents misuse

**Estimated costs:**
- Month 1: ~$5-10 (building database)
- Month 3: ~$2-3 (mostly database hits)
- Month 6+: ~$1-2 (mature database)

## Disable/Enable

### Disable Completely

In `providers.tsx`:

```tsx
// Comment out the floating agent
// {!shouldHideAgent && <FloatingContactAgent />}
```

### Disable Web Search Only

In `.env.local`:

```bash
# Remove or comment out
# TAVILY_API_KEY=...
```

Agent will still work, but only search database (no web fallback).

### Enable Only for Specific Roles

```tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const showAgent = session?.user?.role === "CUSTOMER"; // Only customers

  return (
    <SessionProvider>
      {children}
      {showAgent && <FloatingContactAgent />}
    </SessionProvider>
  );
}
```

## User Feedback

Add feedback tracking:

```tsx
// In ContactAgentChat.tsx
const handleContactSelected = (contact: Contact) => {
  // Track that user found this contact useful
  fetch("/api/analytics/contact-selected", {
    method: "POST",
    body: JSON.stringify({ contactId: contact.id }),
  });

  onContactSelected?.(contact);
};
```

## Future Enhancements

1. **Unread Indicator** - Red dot when new message
2. **Sound Notification** - Ding when agent responds
3. **Persistent History** - Save conversation across sessions
4. **Quick Replies** - Suggested common queries
5. **Multi-Language** - Spanish support for RECA claimants
6. **Voice Input** - Speech-to-text for accessibility

## Two-Tier System Details

### Access Control

The system uses `useSession()` from next-auth to determine user tier:

```tsx
const { data: session } = useSession();
const hasPaidAccess = session?.user?.role === "CUSTOMER";
```

- **Free Tier**: Unauthenticated users OR users without CUSTOMER role
- **Paid Tier**: Users with `role === "CUSTOMER"`

### Visual Differences

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Header Color | Terracotta (orange/red) | Blue |
| Title | "RECA Info Assistant" | "Contact Finder" |
| Subtitle | "Free tier - Basic eligibility & info" | "Find institutional contacts" |
| Upgrade Banner | ✅ Shown | ❌ Hidden |
| API Endpoint | `/api/contact-agent/basic-info` | `/api/contact-agent/chat` |
| Database Access | ❌ No | ✅ Yes |
| Web Search | ❌ No | ✅ Yes (Tavily fallback) |

### Converting Users

The free tier includes an upgrade banner with:
- Lock icon to indicate premium feature
- Text: "Want help finding contacts for documents?"
- "Upgrade" button linking to `/service-tiers`

This creates a natural conversion funnel:
1. User tries free bot
2. Asks about finding contacts
3. Bot explains it's a paid feature
4. Upgrade banner visible at all times
5. User clicks "Upgrade" → `/service-tiers`

## Summary

The floating contact agent provides:

✅ **Two-tier system** - Free basic info + Paid contact search
✅ **Always accessible** - Bottom-right corner on all pages
✅ **Smart paywall** - Encourages upgrades without being pushy
✅ **Scoped assistance** - Free tier for eligibility, paid tier for contacts
✅ **Database + web search** - Best of both worlds (paid tier only)
✅ **Auto-improving** - Learns from web searches
✅ **Cost-effective** - ~$1-2/month at steady state
✅ **User-friendly** - Minimizable, expandable, persistent

Users can get help understanding RECA eligibility for free, and upgrade to get personalized contact search assistance!
