# RECA Downwinder Claim Workflow - Project Documentation Index

## 📁 Project Structure

```
/docs/parsed_form_data/
├── README.md                          (📖 You are here - Start here!)
├── INDEX.md                           (📑 This file - Navigation guide)
├── reca_form_structure.json          (📋 Complete form specification)
├── workflow_logic.json               (🔄 Workflow stages & logic)
├── WORKFLOW_DIAGRAMS.md              (📊 Visual workflow guides)
├── API_SPECIFICATIONS.md             (🔌 API endpoint definitions)
└── RECA_Downwinder_Claim_Form.pdf    (📄 Original source form)
```

---

## 🚀 Quick Start Guide

### For Product Managers
1. **Start here**: `README.md` - Complete project overview and roadmap
2. **Then read**: `WORKFLOW_DIAGRAMS.md` - Visual representation of user journey
3. **Review**: Open questions section in README for decisions needed

### For Developers (Frontend)
1. **Read**: `README.md` - Technical requirements section
2. **Study**: `workflow_logic.json` - Complete workflow state machine
3. **Review**: `WORKFLOW_DIAGRAMS.md` - UI flow and components needed
4. **Reference**: `reca_form_structure.json` - Field definitions and validation

### For Developers (Backend)
1. **Start with**: `API_SPECIFICATIONS.md` - All required endpoints
2. **Then**: `reca_form_structure.json` - Data model structure
3. **Review**: `workflow_logic.json` - Business logic rules
4. **Reference**: Database schema section in README

### For Designers
1. **Begin with**: `WORKFLOW_DIAGRAMS.md` - User flows and journeys
2. **Then**: `workflow_logic.json` → Stage 2 → UI components
3. **Reference**: `reca_form_structure.json` - All form fields and labels

---

## 📚 Document Details

### 1. README.md (Main Documentation)
**Purpose**: Comprehensive project overview and implementation guide

**Key Sections**:
- Project overview and goals
- Form structure summary (16 parts)
- Supporting forms (4 forms)
- Workflow stages (5 stages)
- Conditional logic rules
- UI integration specifications
- Data persistence strategy
- Open questions & decisions
- Implementation roadmap (14-20 weeks)
- Success criteria

**When to use**: 
- Starting the project
- Understanding scope and timeline
- Answering "What are we building?"

---

### 2. reca_form_structure.json (Data Schema)
**Purpose**: Complete technical specification of the RECA form

**Contents**:
- Form metadata (agency, filing methods, contact info)
- All 16 main form parts with:
  - Field definitions (type, validation, labels)
  - Required vs optional fields
  - Conditional logic
  - Document requirements
- Supporting forms structure
- Medical records requirements by disease
- Compensable diseases list

**When to use**:
- Building form components
- Implementing validation
- Creating database schema
- Developing PDF generation

**Key Features**:
- ~8.5KB JSON
- Fully typed field definitions
- Conditional logic embedded
- Document requirement matrices

---

### 3. workflow_logic.json (Business Logic)
**Purpose**: Multi-stage workflow definition with conditional branching

**Contents**:
- 5 workflow stages:
  1. Initial Eligibility Assessment
  2. Form Completion (16 parts)
  3. Supporting Forms
  4. Document Preparation
  5. Review & Submit
- Conditional paths by relationship type
- UI component specifications
- Validation rules
- Data persistence strategy
- Open questions and decision options

**When to use**:
- Building workflow state machine
- Implementing conditional navigation
- Creating progress tracking
- Designing UI components

**Key Features**:
- ~16KB JSON
- Stage-based organization
- UI integration specs
- Technical requirements

---

### 4. WORKFLOW_DIAGRAMS.md (Visual Guide)
**Purpose**: ASCII art diagrams showing flows and relationships

**Contents**:
- High-level flow diagram
- Conditional path decision tree
- Document requirements by filer type
- Exposure eligibility timeline
- Compensable diseases checklist
- Data flow architecture
- Example user journey (surviving spouse)

**When to use**:
- Understanding user flow
- Presenting to stakeholders
- Designing UI/UX
- Onboarding team members

**Key Features**:
- Visual ASCII diagrams
- Step-by-step user journey
- Quick reference charts

---

### 5. API_SPECIFICATIONS.md (Backend Specs)
**Purpose**: Complete API endpoint documentation

**Contents**:
- 9 endpoint definitions:
  1. Get Workflow State
  2. Save Workflow Progress
  3. Validate Section
  4. Get Disease Requirements
  5. Generate PDF
  6. Upload Document
  7. Get Document Checklist
  8. Check Eligibility
  9. Get Affected Areas
- Request/response schemas
- Error handling
- Authentication requirements
- Rate limiting

**When to use**:
- Implementing backend API
- Frontend API integration
- Testing API endpoints
- Documentation reference

**Key Features**:
- Complete request/response examples
- Error code definitions
- Authentication specs
- ~20KB documentation

---

## 🎯 Use Case Navigation

### "I need to understand what we're building"
→ Start: `README.md` (Project Overview)  
→ Then: `WORKFLOW_DIAGRAMS.md` (Visual Guide)

### "I need to implement the form fields"
→ Start: `reca_form_structure.json`  
→ Reference: `README.md` (Form Structure Summary)

### "I need to build the workflow state machine"
→ Start: `workflow_logic.json`  
→ Reference: `WORKFLOW_DIAGRAMS.md` (Decision Tree)

### "I need to design the UI"
→ Start: `WORKFLOW_DIAGRAMS.md`  
→ Then: `workflow_logic.json` (Stage 2 → UI Components)  
→ Reference: `README.md` (UI Integration Specifications)

### "I need to implement the backend"
→ Start: `API_SPECIFICATIONS.md`  
→ Then: `reca_form_structure.json` (Data Schema)  
→ Reference: `workflow_logic.json` (Business Rules)

### "I need to understand eligibility rules"
→ Start: `WORKFLOW_DIAGRAMS.md` (Decision Tree)  
→ Reference: `workflow_logic.json` (Stage 1)  
→ Detail: `README.md` (Conditional Logic Rules)

### "I need to know what documents are required"
→ Start: `WORKFLOW_DIAGRAMS.md` (Document Requirements Matrix)  
→ Detail: `reca_form_structure.json` (Each part → required_documents)  
→ API: `API_SPECIFICATIONS.md` (Get Document Checklist endpoint)

### "I want to see an example user flow"
→ Start: `WORKFLOW_DIAGRAMS.md` (User Journey Example)  
→ Detail: `workflow_logic.json` (Complete workflow stages)

---

## 🔑 Key Concepts Explained

### Relationship Types
The form has 6 relationship types that determine which sections must be completed:
1. **Self** → Part 4 (minimal docs)
2. **Spouse** → Part 5 (marriage verification required)
3. **Child** → Part 6 (sibling information required)
4. **Parent** → Part 7 (staff follow-up required)
5. **Grandchild** → Part 7 (staff follow-up required)
6. **Grandparent** → Part 7 (staff follow-up required)

See: `WORKFLOW_DIAGRAMS.md` → Conditional Path Decision Tree

---

### Eligibility Criteria
Three ways to meet exposure requirement (need only ONE):
1. Affected area ≥1 year (Jan 1951 - Nov 1962)
2. Affected area entire period (Jun-Jul 1962)
3. New Mexico ≥1 year (Sep 1944 - Nov 1962)

See: `WORKFLOW_DIAGRAMS.md` → Exposure Eligibility Timeline

---

### Compensable Diseases
19 eligible cancer types under RECA Section 4.
Each disease has specific medical record requirements.

See: 
- List: `WORKFLOW_DIAGRAMS.md` → Compensable Diseases Checklist
- Details: `reca_form_structure.json` → medical_records_attachment
- API: `API_SPECIFICATIONS.md` → Get Disease Requirements

---

### Filing Methods
Two submission options with different requirements:

**Electronic Filing**:
- ✅ Photocopies accepted
- ✅ Digital signature OK
- ✅ Faster processing
- Portal: www.justice.gov/civil/reca

**Mail Filing**:
- ⚠️ Certified/original docs required
- ⚠️ Hand signature required
- Address: RECA Program, PO Box 146, Washington DC 20044-0146

See: `README.md` → Stage 4: Document Preparation

---

## ❓ Open Questions Tracker

The following questions need answers before implementation:

| # | Question | Impact | Documented In |
|---|----------|--------|---------------|
| 1 | Does "Continue Claim" workflow exist? | UI button placement | README.md → Question 1 |
| 2 | Direct DB modification or separate assistant? | Architecture | README.md → Question 2 |
| 3 | What file upload system exists? | Document handling | README.md → Question 3 |
| 4 | Is RECA.gov API-enabled? | Submission method | README.md → Question 4 |
| 5 | New UI or integrate existing? | UI approach | README.md → Question 5 |

See: `README.md` → Open Questions & Decisions

---

## 📊 Project Statistics

- **Form Parts**: 16 main parts + 4 supporting forms
- **Total Fields**: ~150+ fields across all parts
- **Compensable Diseases**: 19 eligible cancer types
- **Affected Geographic Areas**: 3 states + 6 AZ counties + 6 NV counties
- **Workflow Stages**: 5 major stages
- **Required Documents**: 6-15 depending on relationship type
- **Estimated Timeline**: 14-20 weeks (3.5-5 months)
- **API Endpoints**: 9 core endpoints

---

## 🛠️ Technical Stack Recommendations

### Frontend
- **Framework**: React (or Next.js)
- **Form State**: React Hook Form or Formik
- **Styling**: Tailwind CSS
- **PDF**: pdf-lib
- **Upload**: React Dropzone

### Backend
- **API**: RESTful with JSON
- **Storage**: S3 or similar for documents
- **Database**: PostgreSQL (or existing DB)
- **PDF Generation**: PDFKit or pdf-lib

See: `README.md` → Technical Stack Recommendations

---

## 📈 Success Metrics

### User Experience
- Completion Rate: >70%
- Time to Complete: <60 minutes
- Error Rate: <10%
- User Satisfaction: >4.0/5.0

### Operational
- Higher approval rate for assisted vs manual
- Faster processing time for assisted claims
- 30%+ reduction in support tickets

See: `workflow_logic.json` → success_metrics

---

## 📞 Resources

### RECA Program Contact
- **Phone**: 1-800-729-7327
- **Electronic Portal**: www.justice.gov/civil/reca
- **Mailing Address**: 
  ```
  Radiation Exposure Compensation Program
  U.S. Department of Justice
  P.O. Box 146, Ben Franklin Station
  Washington, DC 20044-0146
  ```

### Project Files
- **Original Form**: `RECA_Downwinder_Claim_Form.pdf` (24 pages)
- **Form Revision**: July 2025
- **OMB Approval**: 1105-0052

---

## 🔄 Next Steps

1. **Review Documentation**: Read README.md completely
2. **Answer Open Questions**: Resolve the 5 decision points
3. **Technical Validation**: Verify stack compatibility
4. **Create Mockups**: Design key workflow screens
5. **Get Approval**: Stakeholder sign-off on approach
6. **Start Phase 1**: Begin backend data structure work

---

## 📝 Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 2025 | Initial documentation | AI Assistant |

---

## 💡 Tips for Using This Documentation

1. **Start with README.md** - It's the anchor document
2. **Use INDEX.md** (this file) - For quick navigation
3. **Reference WORKFLOW_DIAGRAMS.md** - When explaining to others
4. **Deep dive into JSON files** - For implementation details
5. **Check API_SPECIFICATIONS.md** - Before building endpoints

---

## 🎓 Learning Path

### Day 1: Understanding
- [ ] Read README.md completely
- [ ] Review WORKFLOW_DIAGRAMS.md
- [ ] Understand eligibility criteria

### Day 2: Technical Deep Dive
- [ ] Study reca_form_structure.json
- [ ] Analyze workflow_logic.json
- [ ] Review API_SPECIFICATIONS.md

### Day 3: Planning
- [ ] Answer open questions
- [ ] Create technical design doc
- [ ] Break down into sprints

---

**Total Documentation Size**: ~50KB across 6 files  
**Estimated Read Time**: 2-3 hours for complete understanding  
**Implementation Complexity**: Medium-High (multi-stage conditional forms)

---

*Last Updated: January 2025*  
*Project: RadiantClaims RECA Workflow*  
*Status: Documentation Complete - Ready for Implementation Planning*
