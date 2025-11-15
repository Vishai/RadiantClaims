# RECA Resource Contact Database

Comprehensive contact gathering system for institutions that hold RECA-relevant records (1951-1962) in affected states: **Utah, Nevada, Arizona, New Mexico, Idaho**.

## 📁 What's in This Directory

```
contact-gathering/
├── QUICK_START.md                    # ⭐ Start here! Fast path to 300+ contacts
├── CONTACT_GATHERING_STRATEGY.md    # Full strategic overview
├── scraper_hospitals_cms.py         # ✅ READY: CMS hospital API scraper
├── scraper_county_vital_records.py  # 🚧 IN PROGRESS: County scraper
├── master_contact_gatherer.py       # Master orchestration script
├── TEMPLATE_contacts.csv            # Copy this for manual entry
└── output/                          # Generated contact lists go here
```

---

## 🚀 Fastest Way to Get Started (2 hours)

### Option A: Automated (Hospitals Only) - 30 minutes
```bash
# Install dependencies
pip3 install requests pandas beautifulsoup4 --break-system-packages

# Run hospital scraper
python3 scraper_hospitals_cms.py
```

**Output:** ~100-150 hospital contacts in CSV

---

### Option B: Hybrid (Recommended) - 2 hours
1. **Run hospital scraper** (30 min) ✅ Automated
2. **Manually compile county vital records** (1 hour) 📝 Use QUICK_START.md
3. **Add cancer registries** (15 min) 📝 5 state contacts
4. **Add school districts** (15 min) 📝 Focus on county offices

**Output:** ~300-400 total contacts

---

## 📊 Target Contact Types

| Type | Quantity | Priority | Method |
|------|----------|----------|--------|
| County Vital Records | ~150 | HIGH | Manual + Web scraping |
| Hospitals | ~120 | HIGH | CMS API ✅ |
| Cancer Registries | 5 | HIGH | Manual |
| School Districts | ~80 | MEDIUM | Manual (NCES directory) |
| LDS Churches | ~50 | MEDIUM | Manual research |
| Catholic/Protestant | ~30 | LOW | Manual research |
| Historical Employers | ~20 | LOW | Manual research |

**Total Target:** 400-500 institutional contacts

---

## 🎯 Priority Counties (Highest RECA Eligibility)

### Utah (Downwinder Zone)
- Washington County (St. George)
- Iron County (Cedar City)
- Kane, Garfield, Beaver, Millard Counties

### Nevada (Test Site Proximity)
- Nye County (contains Nevada Test Site)
- Lincoln County (downwind)
- Clark County (Las Vegas - largest population)

### Arizona (Northern Tier)
- Coconino, Navajo, Apache, Mohave Counties

### New Mexico (Northwest)
- San Juan, McKinley, Cibola Counties

### Idaho (Eastern/Southern)
- Focus on southeastern counties near Utah border

---

## 📋 Data Schema

Each contact record includes:

**Core Fields:**
- State, StateCode, County
- InstitutionName, InstitutionType
- RecordTypes (what documents they hold)
- OperatingDates (when institution existed)
- Status (Active/Closed/Merged)

**Contact Info:**
- Address, Phone, Email, Website
- RecordsLocation (if closed: where records went)
- RequestMethod (Email/Mail/Phone/Portal)

**Metadata:**
- Source, SourceURL, VerifiedDate, Notes

See `TEMPLATE_contacts.csv` for full schema with examples.

---

## 🔧 Tools & Scripts

### ✅ scraper_hospitals_cms.py
**Status:** PRODUCTION READY
**What it does:** Fetches hospital contacts from CMS Hospital Compare API
**Output:** CSV with ~100-150 hospitals across 5 states
**Runtime:** 5-10 minutes
**Cost:** FREE (government API)

**Usage:**
```python
python3 scraper_hospitals_cms.py
# Creates: reca_hospitals_contacts.csv
```

### 🚧 scraper_county_vital_records.py
**Status:** IN DEVELOPMENT
**What it does:** Scrapes county vital records contacts
**Challenge:** Each state has different website structures
**Alternative:** Manual compilation (see QUICK_START.md)

### 📝 TEMPLATE_contacts.csv
**What it is:** Pre-formatted CSV template with example rows
**How to use:** 
1. Make a copy
2. Fill in contacts as you find them
3. Maintains consistent schema
4. Easy to merge with automated results

---

## 🎓 Key Resources

### Government Directories
- **CDC Vital Records:** https://www.cdc.gov/nchs/w2w/index.htm
- **CMS Hospital Compare:** https://data.cms.gov/
- **NCES School Directory:** https://nces.ed.gov/ccd/districtsearch/

### State-Specific
- **Utah:** https://vitalrecords.utah.gov/
- **Nevada:** https://dpbh.nv.gov/Reg/VitalRecords/
- **Arizona:** https://www.azdhs.gov/licensing/vital-records/
- **New Mexico:** https://www.nmhealth.org/about/erd/bvrhs/
- **Idaho:** https://healthandwelfare.idaho.gov/

### County Directories
- **VitalRecordsOffice.net:** Comprehensive county directory
- **CityDirectory.us:** State-by-state county vital records

---

## 🧪 Testing & Validation

Before using contacts in production:

1. **Phone Verification:** Call sample of contacts to confirm
2. **Email Validation:** Use email validation API (NeverBounce, ZeroBounce)
3. **Address Verification:** Cross-reference with USPS database
4. **Website Checks:** Verify all URLs are active

---

## 📤 Exporting to Airtable

Once you have your CSV:

1. Go to your Airtable base
2. Import CSV to `ResourceContacts` table
3. Map fields to match schema
4. Set up views:
   - "By State" (group by State)
   - "By Type" (group by InstitutionType)
   - "Priority" (filter: Tier 1 only)
   - "Needs Verification" (filter: VerifiedDate is empty)

---

## 💡 Pro Tips

1. **Start with hospitals** - They're automated and high-value
2. **Focus on counties first** - They hold most vital records
3. **LDS records are critical** - Especially for Utah/Idaho
4. **Cancer registries = gold** - Only 5 contacts but vital
5. **School districts > individual schools** - Districts maintain historical records
6. **Verify before mass outreach** - Bad contacts waste time

---

## 📈 Progress Tracking

Create this simple tracker:

| Resource Type | Target | Collected | Verified | % Complete |
|---------------|--------|-----------|----------|------------|
| Hospitals | 120 | 0 | 0 | 0% |
| County Offices | 150 | 0 | 0 | 0% |
| Cancer Registries | 5 | 0 | 0 | 0% |
| School Districts | 80 | 0 | 0 | 0% |
| Churches | 50 | 0 | 0 | 0% |

---

## 🆘 Troubleshooting

**CMS API returns 404:**
- Check if dataset ID changed
- Visit https://data.cms.gov/ to find current hospital dataset

**Script fails with import errors:**
- Run: `pip3 install requests pandas beautifulsoup4 --break-system-packages`

**Too many manual contacts to enter:**
- Prioritize Tier 1 (hospitals, counties, cancer registries)
- Add Tier 2/3 contacts as needed per case

---

## 📞 Next Steps After Collection

1. Import to Airtable `ResourceContacts` table
2. Link to `Documents` table (which records need which contacts)
3. Build request automation in n8n:
   - Auto-generate request letters
   - Attach signed releases
   - Track follow-ups
4. Monitor response rates by institution type
5. Build "preferred provider" list (fast responders)

---

## 📚 Additional Documentation

- `CONTACT_GATHERING_STRATEGY.md` - Full strategic overview
- `QUICK_START.md` - Step-by-step manual compilation guide
- `/mnt/project/Turnkey_Claims_Automation__MVP_Blueprint_` - Original automation blueprint

---

**Questions?** Review the strategy doc or check the original blueprint for context on how these contacts integrate into the full RECA claims automation system.
