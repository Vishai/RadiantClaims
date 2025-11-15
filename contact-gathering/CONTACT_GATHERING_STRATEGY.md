# RECA Contact Gathering Strategy

## Target Resource Types
For RECA claims covering 1951-1962 residency in UT, NV, AZ, NM, ID:

### 1. **County/Municipal Offices**
- Vital Records offices (birth/death certificates)
- County Clerks (property records, voter registration)
- County Recorders (land records, marriage records)
- Health Departments (historical health records)

### 2. **Medical Facilities**
- Hospitals (pathology reports, operative notes)
- Cancer Registries (state-level confirmation)
- Medical Records departments
- Historical hospital archives

### 3. **Educational Institutions**
- Elementary schools (attendance records)
- High schools (transcripts, yearbooks)
- School district offices
- Historical school archives

### 4. **Religious Organizations**
- LDS wards/stakes (membership records, statistical records)
- Catholic parishes (baptismal/confirmation records)
- Protestant churches (membership lists)
- Historical church archives

### 5. **Former Employers**
- Mining companies (major 1950s employers in affected areas)
- Government facilities (Nevada Test Site, military bases)
- Railroad companies
- Manufacturing facilities

### 6. **Utility Companies**
- Electric companies (account history)
- Water districts
- Telephone companies (directory records)

---

## STRATEGY 1: Automated Web Scraping + AI Extraction

### Phase 1: County Government Contacts
**Target websites:**
- VitalRecordsOffice.net (3,000+ county contacts)
- CDC "Where to Write for Vital Records"
- State-specific vital records sites
- County government websites

**Script capabilities:**
1. Scrape county clerk/recorder contact pages
2. Extract: Office name, address, phone, email, fax
3. Categorize by state → county → office type
4. Export to Airtable-ready CSV

**Estimated time:** 2-4 hours to build, 30 minutes to run
**Coverage:** ~150-200 county offices across 5 states

### Phase 2: Hospital & Medical Facilities
**Data sources:**
- CMS Hospital Compare database (API available)
- State health department facility directories
- Historical hospital directories (1950s-60s)
- Cancer registry contact lists (state DOH sites)

**Script capabilities:**
1. Pull from CMS API for current hospitals
2. Cross-reference with historical facility lists
3. Identify medical records departments
4. Flag facilities operating pre-1970

**Estimated time:** 3-5 hours
**Coverage:** ~100-150 hospitals + 5 state cancer registries

### Phase 3: School Districts
**Data sources:**
- National Center for Education Statistics (NCES) database
- State education department directories
- Historical school district maps
- County education office websites

**Challenges:** Many 1950s schools consolidated or closed
**Solution:** Focus on district offices (maintain historical records)

**Estimated time:** 2-3 hours
**Coverage:** ~80-100 school districts

### Phase 4: Religious Organizations
**Data sources:**
- LDS Church History Library (request form)
- Catholic Diocese directories
- Denominational headquarters
- Historical church registries

**Manual component:** Higher - many require phone/mail requests
**Estimated time:** 5-8 hours for database, ongoing for outreach
**Coverage:** ~50-100 primary contacts

---

## STRATEGY 2: Government Open Data APIs

### Available APIs:
1. **CMS Hospital Compare API** (free, comprehensive)
   - All Medicare-certified hospitals
   - Includes contact info, facility type, location

2. **NCES Education Data** (free API)
   - School district boundaries
   - Administrative contacts
   - Historical closure dates

3. **State Government APIs** (varies by state)
   - Utah: data.utah.gov
   - Nevada: data.nv.gov
   - Check each state's open data portal

**Advantages:** 
- Clean, structured data
- Already verified
- Easy to update

**Estimated time:** 4-6 hours to integrate all APIs
**Coverage:** Best for current facilities

---

## STRATEGY 3: Purchase Contact Databases

### Commercial Options:
1. **Reference USA** (library access often free)
   - Business/organization directories
   - Historical records
   - Filter by industry + location

2. **InfoGroup/Data Axle**
   - $500-1,500 for targeted lists
   - Can filter by: state, county, industry code, year established

3. **AccuData America**
   - $0.10-0.25 per contact
   - Can request "established before 1970"

**Pros:** Fast, comprehensive
**Cons:** Cost ($500-2,000), may include defunct organizations
**Best for:** Employer/business contacts

---

## STRATEGY 4: Manual Research + Crowdsourcing

### FamilySearch + Genealogy Communities
- FamilySearch Wiki has county-by-county contact guides
- Local genealogy societies maintain institutional contacts
- Volunteer researchers can help

### County Historical Societies
- Often maintain institutional memory
- Can provide "where did X school's records go?"
- Good for defunct organizations

**Estimated time:** 10-20 hours
**Coverage:** Fills gaps from automation

---

## RECOMMENDED HYBRID APPROACH

### Week 1: Foundation (Automated)
**Day 1-2:** Build county government scraper
- Target: 150-200 vital records offices
- Output: CSV with name, address, phone, email, website

**Day 3:** Pull CMS Hospital data via API
- Target: 100+ current hospitals in affected areas
- Add: "Operating since [year]" flag

**Day 4:** Pull NCES school district data
- Target: 80+ school district offices
- Focus on administrative/records contacts

**Day 5:** Consolidate + deduplicate
- Merge into master Airtable
- Create "Institution Type" taxonomy

### Week 2: Enrichment (Semi-Manual)
**Day 1-2:** Research historical institutions
- Identify closed schools → where records went
- Find defunct hospitals → archive locations
- Map church consolidations

**Day 3-4:** LDS Church outreach
- Submit records request to LDS Family History
- Contact diocese archives for Catholic records
- Research other denominational archives

**Day 5:** QA + categorization
- Verify phone numbers (auto-dial test)
- Flag "deceased" vs "active" institutions
- Tag by RECA-relevant document types

### Week 3: Specialized Contacts
**Employer research:**
- Nevada Test Site contractors (historical)
- Major mining companies (Utah, Arizona)
- Railroad companies (UP, SP, AT&SF)

**Utility companies:**
- NV Energy, APS, PNM, Rocky Mountain Power
- Historical records departments

---

## DELIVERABLE SCHEMA

### Airtable Table: `ResourceContacts`

| Field | Type | Purpose |
|-------|------|---------|
| ContactID | Autonumber | Primary key |
| State | Single select | UT/NV/AZ/NM/ID |
| County | Text | County name |
| InstitutionName | Text | Organization name |
| InstitutionType | Single select | County Office, Hospital, School, Church, Employer, Utility |
| RecordTypes | Multi-select | Birth Cert, Medical, School, Employment, Residence Proof |
| OperatingDates | Text | e.g., "1948-1975" or "1952-present" |
| Status | Single select | Active, Closed, Merged, Unknown |
| Address | Text | Mailing address |
| Phone | Text | Phone number |
| Email | Text | Email |
| Website | URL | Website |
| RecordsLocation | Text | If closed: where records transferred |
| RequestMethod | Single select | Email, Mail, Phone, Online Portal |
| Notes | Long text | Special instructions |
| Source | Text | How we got this contact |
| VerifiedDate | Date | Last verification |

### Priority Tagging System:
- **Tier 1:** High-value (hospitals, county vital records)
- **Tier 2:** Medium-value (schools, major churches)
- **Tier 3:** Lower-value (small employers, utilities)

---

## COST ESTIMATE

### DIY Approach (Time-based):
- Scraper development: 15-20 hours ($0 if you build)
- Data cleaning: 5-10 hours
- Manual research: 10-15 hours
**Total:** 30-45 hours of work, $0 direct cost

### Hybrid Approach:
- Purchase RefUSA access: $0-50 (library card)
- Purchase targeted contact list: $500-1,000
- Development time: 10-15 hours
**Total:** 10-15 hours + $500-1,000

### Fully Outsourced:
- Hire data researcher (Fiverr/Upwork): $300-800
- Purchase premium database: $1,000-2,000
**Total:** $1,300-2,800, minimal time investment

---

## NEXT STEPS

**Option A: I build you the scrapers NOW**
- Python scripts for county/hospital/school scraping
- Integration with Airtable API
- Run time: ~2-4 hours total to gather 300-500 contacts

**Option B: Hybrid purchase + scrape**
- Purchase hospital/employer list ($500-1,000)
- Scrape government contacts (free)
- Manual research for churches (5-10 hours)

**Option C: Start with free APIs**
- CMS Hospital Compare API
- State open data portals
- FamilySearch Wiki manual lookup
- Lowest cost, moderate time investment

**Which approach fits your timeline and budget?**
