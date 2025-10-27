# RadiantClaims Documentation Index

Welcome to the RadiantClaims documentation hub. This index helps you navigate all documentation resources.

---

## 📚 Documentation Categories

### 🚀 Getting Started
- **[Main README](../README.md)** - Project overview, setup instructions, and quick start guide
- **[Installation Guide](../README.md#installation)** - Step-by-step setup for local development

### 🏗️ Development
- **[RECA Implementation Status](./RECA_IMPLEMENTATION_STATUS.md)** - Current development progress on RECA Downwinder Claim Form
- **[RECA Form Structure](./parsed_form_data/reca_form_structure.json)** - Complete specification of the RECA form
- **[API Specifications](./parsed_form_data/API_SPECIFICATIONS.md)** - API endpoint documentation for RECA workflow
- **[Workflow Diagrams](./parsed_form_data/WORKFLOW_DIAGRAMS.md)** - Visual flow diagrams for RECA form logic

### ⚙️ Operations & Maintenance
- **[Operations Guide](./OPERATIONS_GUIDE.md)** ⭐ - **Primary resource for configuration, updates, and maintenance tasks**
  - Partner attorney information updates
  - Environment variable management
  - Database maintenance procedures
  - Deployment procedures
  - Common operational tasks
  - Troubleshooting guide

### 🔧 Configuration Guides
- **[Attorney Info README](../src/lib/reca/ATTORNEY_INFO_README.md)** - Detailed guide for configuring partner attorney information
- **[Documentation Resource Guide](./DOCUMENTATION_RESOURCE_GUIDE_IMPLEMENTATION.md)** - Implementation guide for documentation resources

---

## 🎯 Quick Links by Role

### For Developers
1. Start with [Main README](../README.md) for setup
2. Check [RECA Implementation Status](./RECA_IMPLEMENTATION_STATUS.md) for current work
3. Reference [API Specifications](./parsed_form_data/API_SPECIFICATIONS.md) when building features
4. Review [Operations Guide](./OPERATIONS_GUIDE.md) for deployment procedures

### For Operations Team
1. **Primary Resource**: [Operations Guide](./OPERATIONS_GUIDE.md)
2. Monitor using guidelines in Operations Guide → [Monitoring & Alerts](./OPERATIONS_GUIDE.md#monitoring--alerts)
3. Handle updates via Operations Guide → [Common Tasks](./OPERATIONS_GUIDE.md#common-tasks)
4. Troubleshoot using Operations Guide → [Troubleshooting](./OPERATIONS_GUIDE.md#troubleshooting)

### For Legal/Compliance
1. [RECA Form Structure](./parsed_form_data/reca_form_structure.json) - Official form requirements
2. [Attorney Info README](../src/lib/reca/ATTORNEY_INFO_README.md) - Legal representation configuration
3. [Operations Guide - Attorney Updates](./OPERATIONS_GUIDE.md#partner-attorney-updates) - How to update partner firm info

### For Product/Business
1. [RECA Implementation Status](./RECA_IMPLEMENTATION_STATUS.md) - Feature completion and timeline
2. [Workflow Diagrams](./parsed_form_data/WORKFLOW_DIAGRAMS.md) - Visual form flow and user journey
3. [Operations Guide - Monitoring](./OPERATIONS_GUIDE.md#monitoring--alerts) - Business metrics tracking

---

## 🔍 Finding Information

### "How do I update the partner attorney information?"
→ [Operations Guide - Partner Attorney Updates](./OPERATIONS_GUIDE.md#partner-attorney-updates)

### "What's the current development status?"
→ [RECA Implementation Status](./RECA_IMPLEMENTATION_STATUS.md)

### "How do I deploy changes?"
→ [Operations Guide - Deployment Procedures](./OPERATIONS_GUIDE.md#deployment-procedures)

### "What environment variables do I need?"
→ [Operations Guide - Environment Variables](./OPERATIONS_GUIDE.md#environment-variables)

### "How does the RECA form work?"
→ [Workflow Diagrams](./parsed_form_data/WORKFLOW_DIAGRAMS.md) + [API Specifications](./parsed_form_data/API_SPECIFICATIONS.md)

### "Something broke, what do I do?"
→ [Operations Guide - Troubleshooting](./OPERATIONS_GUIDE.md#troubleshooting)

---

## 📁 Documentation Structure

```
docs/
├── INDEX.md (this file)                          # Documentation hub
├── OPERATIONS_GUIDE.md                           # ⭐ Operations & maintenance
├── RECA_IMPLEMENTATION_STATUS.md                 # Development progress
├── DOCUMENTATION_RESOURCE_GUIDE_IMPLEMENTATION.md
└── parsed_form_data/
    ├── INDEX.md                                  # RECA form docs index
    ├── README.md                                 # RECA project overview
    ├── reca_form_structure.json                  # Complete form spec
    ├── workflow_logic.json                       # Workflow rules
    ├── API_SPECIFICATIONS.md                     # API docs
    └── WORKFLOW_DIAGRAMS.md                      # Visual diagrams

src/lib/reca/
└── ATTORNEY_INFO_README.md                       # Attorney config guide
```

---

## 📝 Documentation Standards

### When to Update Documentation

Update documentation when:
- ✅ Adding new features
- ✅ Changing configuration requirements
- ✅ Modifying deployment procedures
- ✅ Updating partner information
- ✅ Adding new environment variables
- ✅ Changing API endpoints
- ✅ Fixing bugs that affect operations

### Documentation Review Schedule

- **Weekly**: Review RECA Implementation Status
- **Monthly**: Review Operations Guide for accuracy
- **Quarterly**: Full documentation audit
- **On Change**: Update relevant docs immediately

### Documentation Ownership

| Document | Owner | Reviewers |
|----------|-------|-----------|
| OPERATIONS_GUIDE.md | Ops Lead | Dev Lead, Legal |
| RECA_IMPLEMENTATION_STATUS.md | Dev Lead | Product, Ops |
| API_SPECIFICATIONS.md | Dev Lead | Backend Devs |
| ATTORNEY_INFO_README.md | Legal Lead | Ops, Dev |

---

## 🆘 Need Help?

### Documentation Issues
If documentation is unclear, outdated, or missing:
1. Create a GitHub issue with label `documentation`
2. Tag the document owner
3. Suggest improvements

### Quick Questions
- Check the [Operations Guide FAQ](./OPERATIONS_GUIDE.md#common-tasks)
- Search this documentation index
- Ask in team Slack #dev-support

### Emergency Support
For production issues, see [Operations Guide - Emergency Contacts](./OPERATIONS_GUIDE.md#contact--support)

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Review Frequency**: Quarterly
