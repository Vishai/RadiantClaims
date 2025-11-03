import { FileCategory } from "./ai-categorization";

interface HeuristicRule {
  category: FileCategory;
  keywords: Array<RegExp>;
  threshold: number;
  confidence: number;
  description: string;
}

export interface HeuristicCategorizationResult {
  category: FileCategory;
  confidence: number;
  reason: string;
  matchedSignals: string[];
}

const PATHOLOGY_KEYWORDS = [
  /pathology report/i,
  /pathologic diagnosis/i,
  /specimen/i,
  /biopsy/i,
  /tumou?r/i,
  /metastasis/i,
  /histology/i,
  /microscopic findings/i,
  /gross description/i,
  /margin status/i,
  /laboratory/i,
  /patient:/i,
  /diagnosis/i,
  /stage\s+[a-z0-9]+/i,
];

const MEDICAL_KEYWORDS = [
  /medical record/i,
  /treatment plan/i,
  /oncology/i,
  /radiation therapy/i,
  /chemotherapy/i,
  /clinical impression/i,
  /imaging result/i,
  /history of present illness/i,
];

const RESIDENCE_KEYWORDS = [
  /utility bill/i,
  /service address/i,
  /billing address/i,
  /account number/i,
  /statement date/i,
  /amount due/i,
  /meter number/i,
  /customer service/i,
  /usage summary/i,
];

const HEURISTIC_RULES: HeuristicRule[] = [
  {
    category: "PATHOLOGY_REPORT",
    keywords: PATHOLOGY_KEYWORDS,
    threshold: 2,
    confidence: 0.95,
    description:
      "Detected multiple pathology terms (e.g., pathology report, specimen, diagnosis).",
  },
  {
    category: "MEDICAL_RECORDS",
    keywords: MEDICAL_KEYWORDS,
    threshold: 2,
    confidence: 0.9,
    description:
      "Detected several medical record indicators (e.g., treatment plan, oncology notes).",
  },
  {
    category: "PROOF_OF_RESIDENCE",
    keywords: RESIDENCE_KEYWORDS,
    threshold: 2,
    confidence: 0.85,
    description:
      "Detected multiple proof-of-residence indicators (e.g., utility bill, service address).",
  },
];

/**
 * Runs deterministic keyword checks against OCR text to catch obvious category signals.
 * Useful when GPT misclassifies or the user selects the wrong category.
 */
export function detectCategoryFromText(
  text: string
): HeuristicCategorizationResult | null {
  if (!text) return null;

  const matches: HeuristicCategorizationResult[] = [];

  for (const rule of HEURISTIC_RULES) {
    const matchedSignals: string[] = [];
    for (const pattern of rule.keywords) {
      if (pattern.test(text)) {
        matchedSignals.push(pattern.source.replace(/\\|\/|i/g, "").trim());
      }
    }

    if (matchedSignals.length >= rule.threshold) {
      matches.push({
        category: rule.category,
        confidence: rule.confidence,
        reason: `${rule.description} Signals: ${matchedSignals
          .slice(0, 5)
          .join(", ")}`,
        matchedSignals,
      });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Pick the highest confidence result; if equal, prefer the one with more signals
  matches.sort((a, b) => {
    if (b.confidence === a.confidence) {
      return b.matchedSignals.length - a.matchedSignals.length;
    }
    return b.confidence - a.confidence;
  });

  return matches[0] || null;
}
