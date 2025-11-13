# RadiantClaims - Next Session Continuation Prompt

## 📋 Copy/Paste This to Start Next Session:

```
We're continuing development on RadiantClaims, a RECA (Radiation Exposure Compensation Act) claim filing platform.

**What We've Completed:**
1. ✅ Resources System (complete) - /resources page with 20+ government office contacts
2. ✅ Document Upload System (complete) - Upload with category selection, original document indicators
3. ✅ Portal Dashboard (/portal) - Claims overview with "Manage Documents" button
4. ✅ Portal Documents Page (/portal/documents) - Full document management hub
5. ✅ Test claimant account created (claimant@test.com / TestPassword123!)

**Current Status:**
- Main branch: service-tiers
- Document upload working with:
  - Category selection required before upload
  - Auto-detection from filename
  - "Original may be required" indicators for medical/vital records
  - Conservative messaging (no absolute claims about DOJ acceptance)
- Tech stack: Next.js 14, Prisma, PostgreSQL, Stripe, Vercel Blob

**What Claimants Still Need (Priority Order):**

According to IMPLEMENTATION_PRIORITY.md, the next priorities are:

1. **Portal Subscription Page** (`/portal/subscription`)
   - View current plan (DIY $149.99 setup + $24.99/month OR Legal $0 upfront)
   - Update payment method
   - Upgrade DIY → Legal representation
   - Cancel subscription
   - View billing history
   - Refund eligibility (7-day window if PDF not downloaded)

2. **Portal Settings Page** (`/portal/settings`)
   - Personal information (name, email, phone)
   - Notification preferences
   - Security (change password, 2FA)
   - Account management

3. **Document Intelligence** (Future - AI/OCR features)
   - OCR text extraction (Tesseract.js or AWS Textract)
   - Document-to-form alignment validation
   - Cross-reference checking
   - Completeness scoring
   - Pre-submission checklist

**Important Context:**
- We have two service tiers: DIY ($149.99 + $24.99/mo) and Legal ($0 upfront, attorney handles)
- Refund policy: 7-day window, BUT only if user hasn't downloaded their RECA PDF
- We already have `ServiceSubscription` and `StripeCustomer` models in Prisma schema
- Conservative messaging around document requirements (use "typically," "may be," defer to DOJ)
- Original documents required for: medical records, vital records (identity), pathology reports
- Photocopies acceptable for: utility bills, property records, tax returns (marked as such)

**Key Files/Directories:**
- `/src/app/portal/` - Portal pages
- `/src/components/documents/` - Document upload components
- `/src/components/resources/` - Resource finder components
- `/prisma/schema.prisma` - Database schema
- `/scripts/create-test-claimant.ts` - Test user creation
- `IMPLEMENTATION_PRIORITY.md` - Feature roadmap
- `DIY_FEATURES_ROADMAP.md` - Detailed DIY feature specs
- `RESOURCES_SYSTEM_COMPLETE.md` - Resources system documentation

**Test Credentials:**
- Claimant: claimant@test.com / TestPassword123!
- Admin: admin@radiantclaims.dev / Passw0rd!

**What Should We Build Next?**
I recommend starting with the **Portal Subscription Page** since claimants need to manage their subscriptions. Should we proceed with that, or would you prefer to tackle something else?
```

---

## 🎯 Alternative Focused Prompts (Choose Based on Priority):

### Option A: Subscription Management Focus
```
Continue RadiantClaims development. We need to build the Portal Subscription Page (/portal/subscription) for DIY claimants to:
- View current plan details
- Update payment methods
- Upgrade from DIY to Legal representation
- Manage billing and refunds

We have ServiceSubscription model with Stripe integration. Test account: claimant@test.com / TestPassword123!
```

### Option B: Portal Settings Focus
```
Continue RadiantClaims development. We need to build the Portal Settings Page (/portal/settings) for claimants to:
- Update personal information
- Manage notification preferences
- Change password and enable 2FA
- Control account settings

User model already has these fields. Test account: claimant@test.com / TestPassword123!
```

### Option C: Document Intelligence Focus
```
Continue RadiantClaims development. We need to add Document Intelligence features:
- OCR text extraction from uploaded PDFs/images
- Document-to-form data alignment checking
- Automated completeness scoring
- Smart validation and error detection

We have UploadedFile model with ocrText, ocrConfidence fields. Should we use Tesseract.js (free) or AWS Textract (paid)?
```

---

## 📁 Quick Reference Files to Show AI:

If the AI needs context, point it to these files:
1. `/prisma/schema.prisma` - Full database schema
2. `/src/app/portal/page.tsx` - Current portal dashboard
3. `/src/components/documents/DocumentUploadZone.tsx` - Upload component
4. `IMPLEMENTATION_PRIORITY.md` - Roadmap priorities
5. `DIY_FEATURES_ROADMAP.md` - Detailed feature specifications

---

## 🚀 Quick Start Commands:

```bash
# Start dev server
pnpm dev

# Run type check
pnpm typecheck

# Build project
pnpm run build

# Database commands
npx prisma db push        # Push schema changes
npx prisma studio         # Open database GUI
npx tsx scripts/create-test-claimant.ts  # Create test user

# Git status
git status
git diff
```

---

## 💡 Context Preservation Tips:

When starting the next session, also mention:
- **Messaging philosophy:** Conservative language, no absolute claims, defer to DOJ
- **Original document categories:** Medical records, vital records, pathology reports (flagged with "Original may be required")
- **Design system:** Sage/terracotta/cream color palette, rounded-full buttons, compassionate tone
- **No emojis in code** unless explicitly requested
- **Mobile-first:** All components should be responsive

---

## ⚠️ Important Constraints to Remember:

1. **Legal compliance:** We provide document prep only, not legal advice
2. **Refund policy:** 7-day window, voided if RECA PDF downloaded
3. **Stripe fees:** Account for 2.9% + $0.30 in pricing
4. **DOJ requirements:** Always defer to official DOJ guidance
5. **Conservative messaging:** Use "typically," "may be," "check requirements"

---

## 🎯 Recommended Next Action:

**Build Portal Subscription Page** (`/portal/subscription`) because:
- ✅ Claimants need to manage their payments
- ✅ Enables DIY → Legal upgrades
- ✅ Shows billing history and refund eligibility
- ✅ Completes core portal functionality
- ✅ ~1 week estimated build time

After that: Portal Settings → Document Intelligence → Advanced Features

---

**Ready to continue!** 🚀
