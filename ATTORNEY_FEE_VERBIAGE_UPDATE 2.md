# Attorney Fee Verbiage Update

**Date**: December 7, 2024
**Issue**: Incorrect messaging about who pays attorney fees
**Resolution**: Updated all references to clarify payment flow

---

## 🔍 Issue

Previous verbiage incorrectly stated that the DOJ pays attorney fees directly. This is misleading.

**Actual Process**:
1. DOJ pays the claimant directly ($100,000 award)
2. Claimant pays the attorney fee (2% = $2,000) from their award
3. Claimant receives net $98,000

---

## ✅ Files Updated

### 1. `/src/lib/constants/service-tiers.ts`
**Line 77-78**

**Before**:
```typescript
attorneyFeeNote:
  "Attorney fees are limited to 2% of the $100,000 RECA award ($2,000) and are paid directly by the Department of Justice."
```

**After**:
```typescript
attorneyFeeNote:
  "Attorney fees are limited to 2% of the $100,000 RECA award ($2,000). The DOJ pays you directly, and you pay the attorney fee from your award."
```

---

### 2. `/src/app/service-tiers/page.tsx`
**Line 543**

**Before**:
```tsx
+ 2% of award (paid by DOJ)
```

**After**:
```tsx
+ 2% of award (you pay from award)
```

---

### 3. `/src/app/page.tsx`
**Line 131-133**

**Before**:
```tsx
Standard 2% RECA attorney fee applies (paid by DOJ).
```

**After**:
```tsx
Standard 2% RECA attorney fee applies (you pay from your award).
```

---

### 4. `/src/components/pricing/PerClaimPricingDisplay.tsx`
**Line 117**

**Before**:
```tsx
• Attorney fees: 2% of award, paid by DOJ
```

**After**:
```tsx
• Attorney fees: 2% of award (you pay from award)
```

---

### 5. `/src/app/eligibility/page.tsx`
**Line 549-550**

**Before**:
```tsx
DIY: $149.99 + $24.99/mo • Legal: No upfront cost (2% attorney fee paid by DOJ)
```

**After**:
```tsx
DIY: $149.99 + $24.99/mo • Legal: $89.99 setup (refundable) + $24.99/mo + 2% attorney fee (you pay from award)
```

**Note**: Also updated to reflect the new per-claim pricing structure

---

## 📊 Payment Flow Clarification

### Legal Representation Path

**Before (Incorrect)**:
```
DOJ → Claimant ($100,000)
DOJ → Attorney ($2,000)
Claimant receives: $100,000
```

**After (Correct)**:
```
DOJ → Claimant ($100,000)
Claimant → Attorney ($2,000)
Claimant receives: $98,000 net
```

---

## 🎯 Key Messaging Points

1. **DOJ pays claimant directly** - The full $100,000 award goes to the claimant
2. **Claimant pays attorney** - The 2% fee is paid from the award, not by DOJ
3. **Net award is $98,000** - After paying 2% attorney fee
4. **Federal regulation** - This is governed by RECA regulations (42 U.S.C. § 2210 note)

---

## 🔄 Related Updates

While updating attorney fee verbiage, also corrected eligibility page to reflect new per-claim pricing:

**Old**: "Legal: No upfront cost"
**New**: "Legal: $89.99 setup (refundable) + $24.99/mo"

This aligns with the per-claim subscription model implemented in the previous session.

---

## ✅ Verification

All instances of the following phrases have been updated:
- ✅ "paid by DOJ"
- ✅ "DOJ pays"
- ✅ "government pays"
- ✅ "paid directly by the Department of Justice"

New standard phrasing:
- ✅ "you pay from your award"
- ✅ "The DOJ pays you directly, and you pay the attorney fee from your award"

---

## 📝 Documentation References

This verbiage is consistent with:
- Federal RECA regulations (42 U.S.C. § 2210 note)
- Standard attorney contingency fee arrangements
- DOJ payment processing procedures

---

## 🎉 Status

**Complete**: All user-facing verbiage has been updated to correctly reflect the attorney fee payment flow.

**Dev Server**: Running on http://localhost:3001
**Changes**: Live and ready for testing
