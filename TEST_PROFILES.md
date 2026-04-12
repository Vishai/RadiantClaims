# RadiantClaims Test Profiles

Use these profiles to walk through the RECA form wizard. Each one exercises a different path and generates different document requirements.

## Setup — Skip Payment, Go Straight to Forms

Run this once from the project root to seed all 5 test claims into your portal:

```bash
npx tsx scripts/seed-test-profiles.ts brandon@0tomait.com
```

This creates 5 claimants with active workflow sessions and ensures your account has an active subscription. Refresh `/portal` — you'll see 5 claim cards. Click **"Continue Application"** on any of them to jump straight into the form wizard.

---

## Profile 1: Self-Filer (Simplest Path)

**Scenario:** Elderly woman filing for herself. No name changes, no complications. Lives in Utah downwinder area. Single disease.

### Part 1 — Filer Info
- Filing for self: **Yes**
- First Name: **Dorothy**
- Middle Name: **Mae**
- Last Name: **Henderson**
- SSN: **528-44-7193**
- Date of Birth: **06/15/1948**
- Phone (Day): **435-628-3321**
- Phone (Evening): **435-628-3321**
- Email: **dorothy.henderson@gmail.com**
- Mailing Address: **742 Red Hills Parkway**
- City: **St. George**
- County: **Washington**
- State: **Utah**
- ZIP: **84770**
- Former Names: **None**
- Tribal Affiliation: **None**

### Part 3 — Relationship
- Auto-set to **Self** (since filing for self)

### Part 4 — Self-Filer Details
- Name changes: **No**
- Number of marriages: **0**

### Part 8 — Exposure
- Exposure option: **Option 1a** (physically present in designated area for at least 1 year, Jan 21, 1951 – Nov 6, 1962)
- Location: State: **Utah**, Town: **St. George**, Time Period: **1951 – 1962**

### Part 10 — Disease
- Disease: **Primary cancer of the thyroid**

### Part 12 — Prior Compensation
- Received prior payment: **No**
- EEOICPA claim: **No**

### Part 13 — Attorney
- Has attorney: **No**

### Expected Document Checklist
- [ ] Your Birth Certificate
- [ ] Medical Documentation (pathology report)
- [ ] Proof of Presence (2+ documents — utility bills, school records, etc.)

---

## Profile 2: Surviving Spouse with Prior Marriages

**Scenario:** Widow filing for deceased husband. She was previously married (divorced), and her husband was also previously married (spouse died). Complex name chain and multiple marriage certificates needed.

### Part 1 — Filer Info
- Filing for self: **No**
- First Name: **Patricia**
- Middle Name: **Ann**
- Last Name: **Whitaker**
- SSN: **529-62-8841**
- Date of Birth: **03/22/1945**
- Phone (Day): **505-555-0147**
- Email: **pat.whitaker@yahoo.com**
- Mailing Address: **1204 Cerrillos Road**
- City: **Santa Fe**
- County: **Santa Fe**
- State: **New Mexico**
- ZIP: **87505**
- Former Names:
  - **Patricia Gonzales** (Maiden, 1945)
  - **Patricia Reeves** (Married, 1966)

### Part 2 — Deceased Person Info
- First Name: **Harold**
- Middle Name: **Dean**
- Last Name: **Whitaker**
- SSN: **529-18-5540**
- Date of Birth: **11/08/1940**
- Date of Death: **09/12/2022**
- Former Names: **None**

### Part 3 — Relationship
- Relationship: **Spouse**

### Part 5 — Surviving Spouse Details
- Claimant deceased: **Yes**
- Date of death: **09/12/2022**
- Marriage date: **04/15/1978**
- Married at least one year: **Yes**
- Name at marriage: **Patricia Reeves**
- Current name: **Patricia Whitaker**
- Claimant previous marriages: **Yes**
  - Spouse: **Evelyn Brooks**, married **1963**, ended **1975**, reason: **Death**
- Filer other marriages: **Yes**
  - Spouse: **Thomas Reeves**, married **1966**, ended **1976**, reason: **Divorce**

### Part 8 — Exposure
- Exposure option: **Option 2** (New Mexico for at least 1 year, Sep 24, 1944 – Nov 6, 1962)
- Location: State: **New Mexico**, Town: **Santa Fe**, Time Period: **1944 – 1962**

### Part 10 — Disease
- Diseases: **Primary cancer of the lung**, **Primary cancer of the esophagus**

### Part 12 — Prior Compensation
- Received prior payment: **No**
- EEOICPA claim: **No**

### Part 13 — Attorney
- Has attorney: **No**

### Expected Document Checklist
- [ ] Your Birth Certificate (Patricia)
- [ ] Harold's Death Certificate
- [ ] Marriage Certificate (Patricia & Harold, 1978)
- [ ] Patricia's Divorce Decree (from Thomas Reeves, 1976)
- [ ] Harold's previous marriage certificate (Evelyn Brooks, 1963)
- [ ] Marriage Certificate(s) / Name Change Docs (maiden → Reeves → Whitaker)
- [ ] Medical Documentation (pathology report for lung + esophagus)
- [ ] Proof of Presence (2+ documents)

---

## Profile 3: Child Filing — Multiple Siblings, Some Deceased

**Scenario:** Adult daughter filing for compensation from her deceased father. She has three siblings: one living brother, one deceased brother, and one living sister who changed her last name through marriage. This is the most complex document path.

### Part 1 — Filer Info
- Filing for self: **No**
- First Name: **Karen**
- Middle Name: **Louise**
- Last Name: **Mitchell**
- SSN: **528-77-3302**
- Date of Birth: **07/12/1965**
- Phone (Day): **435-867-4455**
- Email: **karen.mitchell@hotmail.com**
- Mailing Address: **88 Pioneer Road**
- City: **Cedar City**
- County: **Iron**
- State: **Utah**
- ZIP: **84720**
- Former Names:
  - **Karen Packer** (Maiden, 1965)

### Part 2 — Deceased Person Info
- First Name: **Wayne**
- Middle Name: **Earl**
- Last Name: **Packer**
- SSN: **528-30-6671**
- Date of Birth: **02/14/1935**
- Date of Death: **01/03/2018**
- Former Names: **None**

### Part 3 — Relationship
- Relationship: **Child**

### Part 6 — Surviving Child Details
- Claimant deceased: **Yes**
- Claimant ever married: **Yes**
  - Spouse: **Carol Jean Packer (née Lewis)**, married **1958**, ended **2018** (death)
- Surviving spouse exists: **No** (Carol passed in 2020)
- Surviving spouse met one-year requirement: **N/A**
- Child type: **Natural**
- Other children exist: **Yes**
- Siblings:

**Sibling 1 — Living brother, no name change:**
- Name: **David Wayne Packer**
- Date of Birth: **03/20/1960**
- City of Birth: **St. George**
- State of Birth: **UT**
- Deceased: **No**
- Current Address: **221 Tabernacle St, St. George, UT 84770**
- Phone: **435-673-8812**
- Had name change: **No**

**Sibling 2 — Deceased brother:**
- Name: **Michael Ray Packer**
- Date of Birth: **11/05/1962**
- City of Birth: **St. George**
- State of Birth: **UT**
- Deceased: **Yes**
- Date of Death: **06/22/2019**
- City of Death: **Las Vegas**
- State of Death: **NV**
- Has death certificate: **Yes**
- Had name change: **No**

**Sibling 3 — Living sister, married name:**
- Name: **Susan Packer-Olsen**
- Date of Birth: **05/18/1968**
- City of Birth: **Cedar City**
- State of Birth: **UT**
- Deceased: **No**
- Current Address: **1502 S Main St, Salt Lake City, UT 84115**
- Phone: **801-555-9023**
- Had name change: **Yes**
- Original last name: **Packer**
- Name change history:
  - Previous name: **Susan Packer**, Date: **08/10/1991**, Reason: **Marriage**

### Part 8 — Exposure
- Exposure option: **Option 1a** (physically present in designated area for at least 1 year)
- Location 1: State: **Utah**, Town: **St. George**, Time Period: **1935 – 1962**

### Part 10 — Disease
- Diseases: **Primary cancer of the stomach**, **Multiple Myeloma**

### Part 12 — Prior Compensation
- Received prior payment: **No**
- EEOICPA claim: **No**

### Part 13 — Attorney
- Has attorney: **No**

### Expected Document Checklist
- [ ] Karen's Birth Certificate
- [ ] Wayne Packer's Death Certificate
- [ ] Wayne Packer's Birth Certificate
- [ ] Karen's Marriage Certificate (Packer → Mitchell name change)
- [ ] David Wayne Packer — Birth Certificate
- [ ] Michael Ray Packer — Birth Certificate
- [ ] Michael Ray Packer — Death Certificate
- [ ] Susan Packer-Olsen — Birth Certificate
- [ ] Susan Packer-Olsen — Marriage Certificate (Packer → Packer-Olsen)
- [ ] Medical Documentation (pathology reports for stomach cancer + multiple myeloma)
- [ ] Proof of Presence (2+ documents)

---

## Profile 4: Grandchild Filing — Relationship Chain

**Scenario:** Grandchild filing for deceased grandfather. Both grandfather and the grandchild's parent (the intermediate link) are deceased. Tests the Part 7 relationship chain and intermediary death certificates.

### Part 1 — Filer Info
- Filing for self: **No**
- First Name: **Ryan**
- Middle Name: **James**
- Last Name: **Begay**
- SSN: **529-88-1104**
- Date of Birth: **09/03/1988**
- Phone (Day): **928-555-0233**
- Email: **ryan.begay@gmail.com**
- Mailing Address: **PO Box 443**
- City: **Tuba City**
- County: **Coconino**
- State: **Arizona**
- ZIP: **86045**
- Former Names: **None**
- Tribal Affiliation: **Navajo Nation**
- Tribal Census Number: **NN-284553**

### Part 2 — Deceased Person Info
- First Name: **Thomas**
- Middle Name: **Sr.**
- Last Name: **Begay**
- SSN: **529-14-2278**
- Date of Birth: **04/22/1928**
- Date of Death: **03/10/2005**
- Former Names: **None**

### Part 3 — Relationship
- Relationship: **Grandchild**

### Part 7 — Other Relatives (Relationship Chain)
- Intermediary relative (the link between filer and exposed person):
  - Name: **Thomas Begay Jr.**
  - Relationship to exposed: **Son**
  - Relationship to filer: **Father**
  - Deceased: **Yes**
  - Date of death: **11/28/2019**

### Part 8 — Exposure
- Exposure option: **Option 1a** (physically present in designated area for at least 1 year)
- Location: Arizona County: **Coconino**, Town: **Tuba City**, Time Period: **1951 – 1962**

### Part 10 — Disease
- Disease: **Leukemia**

### Part 12 — Prior Compensation
- Received prior payment: **No**
- EEOICPA claim: **No**

### Part 13 — Attorney
- Has attorney: **No**

### Expected Document Checklist
- [ ] Ryan's Birth Certificate
- [ ] Thomas Sr. Begay's Death Certificate
- [ ] Thomas Sr. Begay's Birth Certificate
- [ ] Thomas Begay Jr. — Birth Certificate (proves son of Thomas Sr.)
- [ ] Thomas Begay Jr. — Death Certificate (intermediary is deceased)
- [ ] Ryan's Birth Certificate (proves child of Thomas Jr.) — may overlap with first item
- [ ] Medical Documentation (pathology report for leukemia)
- [ ] Proof of Presence (2+ documents)

---

## Profile 5: Self-Filer with Name Changes (Nevada Exposure)

**Scenario:** Woman filing for herself who has been married three times. Tests name chain documentation and Nevada exposure path.

### Part 1 — Filer Info
- Filing for self: **Yes**
- First Name: **Bonnie**
- Middle Name: **Jean**
- Last Name: **Frederickson**
- SSN: **530-22-8856**
- Date of Birth: **08/30/1946**
- Phone (Day): **775-555-0189**
- Email: **bonnie.fred@gmail.com**
- Mailing Address: **3310 E Aultman St**
- City: **Ely**
- County: **White Pine**
- State: **Nevada**
- ZIP: **89301**
- Former Names:
  - **Bonnie Larsen** (Maiden, 1946)
  - **Bonnie Carter** (Married, 1967)
  - **Bonnie Holloway** (Married, 1979)

### Part 3 — Relationship
- Auto-set to **Self**

### Part 4 — Self-Filer Details
- Name changes: **Yes**
- Number of marriages: **3**
- Marriage details:
  1. Previous: **Bonnie Larsen** → Married: **Bonnie Carter** (1967)
  2. Previous: **Bonnie Carter** → Married: **Bonnie Holloway** (1979)
  3. Previous: **Bonnie Holloway** → Married: **Bonnie Frederickson** (1998)

### Part 8 — Exposure
- Exposure option: **Option 1a**
- Location: Nevada County: **White Pine**, Town: **Ely**, Time Period: **1951 – 1962**

### Part 10 — Disease
- Diseases: **Primary cancer of the breast**, **Primary cancer of the ovary**

### Part 12 — Prior Compensation
- Received prior payment: **No**
- EEOICPA claim: **No**

### Part 13 — Attorney
- Has attorney: **No**

### Expected Document Checklist
- [ ] Birth Certificate (Bonnie Larsen)
- [ ] Marriage Certificate #1 (Larsen → Carter, 1967)
- [ ] Divorce Decree or Death Cert for marriage #1 ending
- [ ] Marriage Certificate #2 (Carter → Holloway, 1979)
- [ ] Divorce Decree or Death Cert for marriage #2 ending
- [ ] Marriage Certificate #3 (Holloway → Frederickson, 1998)
- [ ] Medical Documentation (pathology reports for breast + ovary)
- [ ] Proof of Presence (2+ documents)

---

## Quick Reference — What Each Profile Tests

| Profile | Relationship | Key Paths Tested |
|---------|-------------|-----------------|
| 1. Dorothy | Self | Simplest path, minimal docs, Utah exposure |
| 2. Patricia | Spouse | Prior marriages (both sides), divorce papers, name chain, NM exposure |
| 3. Karen | Child | Sibling disclosure, deceased sibling death cert, sibling name changes, multiple diseases |
| 4. Ryan | Grandchild | Relationship chain, intermediary death cert, tribal affiliation, AZ exposure |
| 5. Bonnie | Self | 3 marriages / name changes, Nevada exposure, multiple name chain docs |

## Testing Checklist Per Profile

For each profile, verify:
1. [ ] Click "Continue Application" from portal → form wizard loads
2. [ ] All 16 parts are navigable (skip non-applicable ones)
3. [ ] Form auto-saves as you progress (check "Last Saved" on portal)
4. [ ] Review page shows correct summary data
5. [ ] Review page "Upload Documents" button navigates to `/reca/documents/[sessionId]`
6. [ ] Document Readiness Card on portal shows personalized checklist matching the profile's expected docs
7. [ ] Session documents page sidebar shows matching requirements
8. [ ] "How Filing Works" banner displays and dismisses properly (localStorage persists)
9. [ ] Chrome Extension card is visible and positioned above DOJ Submission Card
10. [ ] "Documents" vs "Request Medical Records" buttons are clearly distinguishable
11. [ ] Portal progress bar updates as you complete form sections
