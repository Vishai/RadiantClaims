# AI Validation System - Quick Reference Card

## 📍 You Are Here
**Phase 1: Foundation** - 35% Complete (Database ✅, Base Architecture ✅, 3/7 Agents ✅)

---

## 🚀 Quick Start Commands

```bash
# Start development
pnpm dev

# Check database
pnpm prisma studio

# Run migrations (if needed)
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Format code
pnpm format

# Type check
pnpm type-check
```

---

## 📁 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `prisma/schema.prisma` | Database models | ✅ Complete |
| `src/lib/ai-agents/base-agent.ts` | Base class for all agents | ✅ Complete |
| `src/lib/ai-agents/types/agent-results.ts` | TypeScript types | ✅ Complete |
| `src/lib/ai-agents/reca-reference-data.ts` | RECA constants | ✅ Complete |
| `src/lib/ai-agents/agents/classifier-agent.ts` | Categorizes documents | ✅ Complete |
| `src/lib/ai-agents/agents/identity-verification-agent.ts` | Validates identity docs | ✅ Complete |
| `src/lib/ai-agents/agents/medical-compliance-agent.ts` | Validates medical docs | ✅ Complete |

---

## 🎯 Next Steps (Priority Order)

1. ⏳ **ResidenceProofAgent** - Validates residence in covered counties
2. ⏳ **EmploymentVerificationAgent** - Validates nuclear facility employment
3. ⏳ **CompletenessOrchestratorAgent** - Claim-level completeness check
4. ⏳ **DataExtractionAgent** - Consolidates data for form pre-fill
5. ⏳ **Orchestration Service** - Coordinates agent execution
6. ⏳ **API Endpoints** - Trigger validation, get results

---

## 🏗️ Agent Implementation Checklist

When creating a new agent:

- [ ] Extend `BaseAgent<YourResult>`
- [ ] Implement `validate(context)` method
- [ ] Implement `storeResult(context, result, logId)` method
- [ ] Create `buildSystemPrompt()` helper
- [ ] Create `buildUserPrompt(context)` helper
- [ ] Build evidence array
- [ ] Detect issues (CRITICAL, WARNING, INFO)
- [ ] Calculate confidence score
- [ ] Determine status (PASS/FAIL/NEEDS_REVIEW/ERROR)
- [ ] Store result in `DocumentValidation` table
- [ ] Add to `src/lib/ai-agents/agents/index.ts`
- [ ] Test with sample document

---

## 📊 Database Models Quick Reference

### DocumentValidation
```typescript
{
  uploadedFileId: string;
  classifierResult: Json;      // From ClassifierAgent
  identityResult: Json;        // From IdentityVerificationAgent
  medicalResult: Json;         // From MedicalComplianceAgent
  residenceResult: Json;       // From ResidenceProofAgent
  employmentResult: Json;      // From EmploymentVerificationAgent
  extractedData: Json;         // From DataExtractionAgent
  status: ValidationStatus;    // PENDING | PROCESSING | VERIFIED | NEEDS_REVIEW
  overallConfidence: number;   // 0-1
  criticalIssues: Json[];
  warnings: Json[];
}
```

### ClaimReadiness
```typescript
{
  intakeSessionId: string;
  readinessScore: number;           // 0-100
  isReadyForSubmission: boolean;
  completeness: Json;               // Section-by-section completeness
  criticalBlockers: Json[];
  staffReviewStatus: ClaimReviewStatus;
}
```

### AgentExecutionLog
```typescript
{
  agentName: string;              // e.g., "ClassifierAgent"
  agentVersion: string;           // e.g., "1.0"
  uploadedFileId?: string;
  intakeSessionId?: string;
  status: AgentExecutionStatus;   // PENDING | RUNNING | COMPLETED | FAILED
  input: Json;
  output: Json;
  executionTimeMs: number;
  tokensUsed: number;
  estimatedCost: number;          // USD
}
```

---

## 🎨 Agent Status Flow

```
PENDING → RUNNING → COMPLETED
                  ↘ FAILED
                  ↘ TIMEOUT
```

### Validation Status Flow

```
PENDING → PROCESSING → VERIFIED
                    ↘ NEEDS_REVIEW → STAFF_APPROVED
                    ↘ REJECTED
                    ↘ ERROR
```

---

## 🧪 Testing Template

```typescript
// Test agent locally
import { ClassifierAgent } from '@/lib/ai-agents/agents';

const agent = new ClassifierAgent();
const result = await agent.execute({
  uploadedFileId: 'test-file-id',
  documentUrl: 'https://...',
  documentText: 'Sample document text...',
});

console.log(result);
```

---

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `IMPLEMENTATION_STATUS.md` | Current progress, what's done/todo |
| `NEXT_SESSION_PROMPT.md` | How to continue next session |
| `SESSION_SUMMARY.md` | What was accomplished today |
| `ARCHITECTURE_DIAGRAM.md` | Visual system architecture |
| `PROJECT_OVERVIEW.md` | High-level project goals |
| `IMPLEMENTATION_PLAN.md` | Week-by-week timeline |
| `DATABASE_SCHEMA.md` | Detailed schema documentation |
| `AI_AGENT_ARCHITECTURE.md` | Agent design patterns |

---

## 🐛 Common Issues

### Issue: Prisma client out of sync
**Solution:** `pnpm prisma generate`

### Issue: Database schema changed
**Solution:** `pnpm prisma db push`

### Issue: OpenAI timeout
**Solution:** Increase timeout in agent config

### Issue: JSON parsing error
**Solution:** Check OpenAI response format, may need to tune prompt

---

## 💰 Cost Estimation

| Agent | Tokens (avg) | Cost (est) |
|-------|--------------|------------|
| Classifier | 2,000 | $0.04 |
| Identity | 3,000 | $0.06 |
| Medical | 4,000 | $0.08 |
| Residence | 2,500 | $0.05 |
| Employment | 2,500 | $0.05 |
| Completeness | 3,000 | $0.06 |
| DataExtraction | 5,000 | $0.10 |
| **Total per claim** | **~22,000** | **~$0.44** |

*Based on GPT-4o pricing: $5/1M input tokens, $15/1M output tokens*

---

## 🎯 Success Criteria

- [ ] All 7 agents implemented
- [ ] >90% classification accuracy
- [ ] >95% data extraction accuracy
- [ ] <5 minute processing time per claim
- [ ] <10% staff override rate
- [ ] Zero data loss
- [ ] Complete audit trail

---

## 🚨 Critical Reminders

1. **Never commit API keys** - Use `.env` file
2. **Test with real documents** - AI accuracy is theoretical until tested
3. **Monitor costs** - OpenAI charges per token
4. **Handle timeouts** - Long documents may need more time
5. **Staff override capability** - AI is helper, not decision maker
6. **Audit everything** - Store all agent executions for compliance

---

## 📞 Help Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **RECA Official Site:** https://www.justice.gov/civil/reca
- **Project Documentation:** `docs/ai-validation-refactor/`

---

**Version:** 1.0 (November 4, 2025)
**Last Updated:** End of first implementation session
