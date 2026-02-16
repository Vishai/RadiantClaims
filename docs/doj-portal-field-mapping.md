# DOJ RECA Portal — Field Mapping (Downwinder / Self-Filer)

> Mapped directly from `reca.justice.gov/ClaimsPortal` on 2026-02-16.
> Portal is a Salesforce Communities app. Application Number: 00007390 (test).

## Portal Structure

The claim form has **6 tabs** (pages):

1. **Claimant and Applicant** — Identity + Contact info
2. **Identification Documentation** — Upload birth cert, marriage cert, etc.
3. **Exposure** — Radiation exposure type + location/dates
4. **Proof of Presence** — Upload residency documents
5. **Compensable and Proof of Disease** — Select disease(s) + upload medical docs
6. **Prior Compensation** — Previous payments/awards

---

## Pre-Form: Claim Type Selection

| Portal Field | Type | Required | Values / Notes | RC Field |
|---|---|---|---|---|
| Radiation exposure category | radio | ✅ | `Onsite`, `Downwind`, `Uranium`, `Manhattan` | `claimType` |
| Previous Claim Numbers | text | | Free text | `previousClaimNumbers` |
| Primary beneficiary | radio | ✅ | `Self` (person who became ill), `Survivor` (eligible surviving beneficiary) | `beneficiaryType` |
| Court appointed legal guardian | radio | ✅ | `GuardianOtherSelf`, `NoCourtAppointedOtherSelf` | `hasLegalGuardian` |
| Attorney hired for filing | radio | ✅ | `Yes`, `No` | `hasAttorney` |
| Person completing form | radio | ✅ | `UserClaimant` (self-filer) — other options appear for survivor/attorney | `filerType` |

---

## Tab 1: Claimant and Applicant — Person Who Became Ill

| Portal Field | SF Field Name | Type | Required | RC Field |
|---|---|---|---|---|
| First Name | `First_Name` | text | ✅ | `firstName` |
| Middle Name | `Middle_Name` | text | | `middleName` |
| Last Name | `Last_Name` | text | | `lastName` |
| Former and Maiden Names | (textarea) | textarea | | `formerNames` / `maidenName` |
| Social Security Number | (masked) | text (###-##-####) | ✅ | `ssn` |
| Date of Birth | `input1` | date (MM/DD/YYYY) | ✅ | `dateOfBirth` |

## Tab 1 (cont): Primary Beneficiary — Contact Info

| Portal Field | SF Field Name | Type | Required | RC Field |
|---|---|---|---|---|
| Place of Birth | `RECA_Place_of_Birth__c` | text | | `placeOfBirth` |
| Phone Number (Day) | (tel) | tel | | `phonePrimary` |
| Phone Number (Evening) | (tel) | tel | | `phoneSecondary` |
| Email | (text) | text | | `email` |
| **Mailing Address** | | | | |
| Country | `country` | combobox | ✅ | `mailingCountry` (default: "United States") |
| Street | `street` | textarea | ✅ | `mailingStreet` |
| City | `city` | text | ✅ | `mailingCity` |
| State/Province | `province` | combobox | ✅ | `mailingState` |
| Zip/Postal Code | `postalCode` | text | ✅ | `mailingZip` |
| Same as mailing? | `Copy` | checkbox | | `residenceSameAsMailing` |
| **Residence Address** | | | | |
| Country/Territory | `country` | combobox | | `residenceCountry` |
| Street | `street` | textarea | | `residenceStreet` |
| City | `city` | text | | `residenceCity` |
| State/Province | `province` | combobox | | `residenceState` |
| ZIP/Postal Code | `postalCode` | text | | `residenceZip` |
| Member of Indian Tribe | (radio) | radio | ✅ | `isIndianTribeMember` (`Yes`/`No`) |

---

## Tab 2: Identification Documentation

**Section: Self Filer**

Upload certified/original copies of:
- **Birth certificate** of person who became ill
- **Marriage certificate(s)** documenting name changes (if applicable)
- **Divorce decree or court order** for name changes (if applicable)

**File Type dropdown** (`File_Type_Self`):
- `Birth Certificate`
- `Marriage Certificate`
- `Divorce Decree`
- `Other Name Change Records`

---

## Tab 3: Exposure (Downwinder)

| Portal Field | Type | Required | Values / Notes | RC Field |
|---|---|---|---|---|
| Exposure period option | radio | ✅ | See options below | `exposurePeriod` |

**Exposure period options:**
1. Physically present in designated area for **entire period** June 30–July 31, 1962
2. Physically present in **New Mexico** for ≥1 year, Sep 24 1944–Nov 6 1962
3. Physically present in **designated area** for ≥1 year, Jan 21 1951–Nov 6 1962

**Designated areas:**
- Anywhere in Idaho, New Mexico, or Utah
- Arizona counties: Coconino, Yavapai, Navajo, Apache, Gila, Mohave
- Nevada counties: White Pine, Nye, Lander, Lincoln, Eureka, Clark (limited townships)

**Location entries (repeatable):**

| Portal Field | Type | Required | Notes | RC Field |
|---|---|---|---|---|
| State | combobox | ✅ | `Idaho`, `New Mexico`, `Utah`, `Arizona`, `Nevada` | `exposureState` |
| County | combobox | | Conditional on state (AZ/NV only?) | `exposureCounty` |
| Town or City | text | | | `exposureTownCity` |
| Start Date | date | | MM/DD/YYYY | `exposureStartDate` |
| End Date | date | | MM/DD/YYYY | `exposureEndDate` |

*Can add multiple entries (Add/Remove buttons).*

---

## Tab 4: Proof of Presence in Affected Area

Upload documents proving physical presence during designated period.

**File Type dropdown:**
- `Tax Records`
- `School Records`
- `Employment Records`
- `Birth Certificate`
- `Marriage Certificate`
- `Personal Letters or Envelopes`
- `Church / Religious Records`
- `Voting Records`
- `Personal Diaries`
- `Other Proof of Presence Records`

**LDS Church Records section:**

| Portal Field | Type | Required | Notes | RC Field |
|---|---|---|---|---|
| Contacted LDS Church? | radio | | `Yes` / `No` | `contactedLDSChurch` |

Contact info provided:
- Phone: (801) 240-3500
- Address: The Church of Jesus Christ of Latter-day Saints, Member and Statistical Records Division, 17th Floor, 50 East North Temple Street, Salt Lake City, Utah 84150

---

## Tab 5: Compensable and Proof of Disease

**Disease selection** (dual-list picker — move Available → Chosen):

| Disease | RC Value |
|---|---|
| Leukemia | `leukemia` |
| Multiple Myeloma | `multiple_myeloma` |
| Lymphomas (other than Hodgkin's disease) | `lymphomas` |
| Primary cancer of the thyroid | `cancer_thyroid` |
| Primary cancer of the male or female breast | `cancer_breast` |
| Primary cancer of the esophagus | `cancer_esophagus` |
| Primary cancer of the stomach | `cancer_stomach` |
| Primary cancer of the pharynx | `cancer_pharynx` |
| Primary cancer of the small intestine | `cancer_small_intestine` |
| Primary cancer of the pancreas | `cancer_pancreas` |
| Primary cancer of the bile ducts | `cancer_bile_ducts` |
| Primary cancer of the gall bladder | `cancer_gall_bladder` |
| Primary cancer of the salivary gland | `cancer_salivary_gland` |
| Primary cancer of the urinary bladder | `cancer_urinary_bladder` |
| Primary cancer of the brain | `cancer_brain` |
| Primary cancer of the colon | `cancer_colon` |
| Primary cancer of the ovary | `cancer_ovary` |
| Primary cancer of the liver (except cirrhosis/hep B) | `cancer_liver` |
| Primary cancer of the lung | `cancer_lung` |

*Must select at least one disease.*

*(Likely also has medical document upload section after disease selection — need to click Next to see.)*

---

## Tab 6: Prior Compensation

| Portal Field | Type | Required | Values | RC Field |
|---|---|---|---|---|
| Received prior payment/settlement? | radio | | `Yes` / `No` | `receivedPriorPayment` |
| Received EEOICPA compensation? | radio | | `Yes` / `No` | `receivedEEOICPA` |

**File upload** (if Yes):
- File Type: `Previous Payment Records`

---

## Post-Form: Review & Submit

After all tabs, there should be a review/summary page and "Submit My Claim" button.
The claim remains **unfiled** until "Submit My Claim" is clicked.
After submission: confirmation online, then acknowledgement letter by mail with RECA claim number.

---

## Notes

- Portal built on Salesforce Communities (Lightning)
- Radio buttons rendered in shadow DOM (Salesforce Lightning Web Components)
- All state dropdowns use US state names (not abbreviations)
- Dates use MM/DD/YYYY format
- SSN masked after entry (shows ###-##-XXXX)
- File uploads accept scans of certified/original documents
- DOJ may request original/certified copies by mail after e-filing
- Application auto-saves as "In Progress" — can return to complete
- Deadline: December 31, 2027
