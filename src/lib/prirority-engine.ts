/**
 * RadiantClaims - Intake Priority Engine
 * * This module calculates the priority of document tasks based on the
 * RECA "Hard Stop" deadline of Dec 31, 2027.
 * * It shifts the UX from "Linear" to "Latency-Weighted".
 */

import { differenceInDays } from "date-fns";
import { FileCategory } from "./intake-upload";

// The Hard Stop for the RECA program
const PROGRAM_EXPIRATION_DATE = new Date("2027-12-31");

export type DocType =
  | "MEDICAL_PATHOLOGY"
  | "MEDICAL_SUMMARY"
  | "EMPLOYMENT_MINING"
  | "EMPLOYMENT_ONSITE"
  | "VITAL_BIRTH"
  | "VITAL_DEATH"
  | "VITAL_MARRIAGE"
  | "PROOF_RESIDENCE"
  | "ID_SCAN"
  | "OTHER";

export interface DocumentTask {
  id: string;
  type: DocType;
  category: FileCategory;
  status: "MISSING" | "REQUESTED" | "RECEIVED";
  label: string;
  description?: string;
}

export interface PriorityTask extends DocumentTask {
  estimatedLeadTimeDays: number;
  priorityScore: number;
  urgencyLabel: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
}

// Estimated latency (in days) for retrieving documents from external sources
const LATENCY_MAP: Record<DocType, number> = {
  MEDICAL_PATHOLOGY: 180, // Archives take forever
  MEDICAL_SUMMARY: 90,
  EMPLOYMENT_MINING: 120,
  EMPLOYMENT_ONSITE: 120,
  VITAL_BIRTH: 45,
  VITAL_DEATH: 45,
  VITAL_MARRIAGE: 30,
  PROOF_RESIDENCE: 14, // Finding yearbooks/affidavits
  ID_SCAN: 1, // User has this in wallet
  OTHER: 7,
};

// Criticality weights (Medical proof is mandatory for payment)
const CRITICALITY_WEIGHTS: Record<DocType, number> = {
  MEDICAL_PATHOLOGY: 2.0, // Highest priority
  MEDICAL_SUMMARY: 1.5,
  EMPLOYMENT_MINING: 2.0,
  EMPLOYMENT_ONSITE: 2.0,
  VITAL_BIRTH: 1.2,
  VITAL_DEATH: 1.2,
  VITAL_MARRIAGE: 1.0,
  PROOF_RESIDENCE: 1.0,
  ID_SCAN: 0.5,
  OTHER: 0.8,
};

/**
 * Maps the intake-upload FileCategory to our internal DocType for priority calculation
 */
export function mapCategoryToDocType(category: FileCategory): DocType {
  switch (category) {
    case "PATHOLOGY_REPORT":
      return "MEDICAL_PATHOLOGY";
    case "MEDICAL_RECORDS":
    case "DISCHARGE_SUMMARY":
    case "TUMOR_REGISTRY":
    case "TREATMENT_RECORDS":
      return "MEDICAL_SUMMARY";
    case "EMPLOYMENT_RECORDS":
      return "EMPLOYMENT_ONSITE"; // Generalizing for now
    case "IDENTITY":
      return "ID_SCAN";
    case "DEATH_CERTIFICATE":
      return "VITAL_DEATH";
    case "BIRTH_CERTIFICATE":
      return "VITAL_BIRTH";
    case "MARRIAGE_CERTIFICATE":
      return "VITAL_MARRIAGE";
    case "PROOF_OF_RESIDENCE":
    case "UTILITY_BILL":
    case "MORTGAGE_STATEMENT":
    case "SCHOOL_RECORDS":
    case "LDS_CHURCH_RECORDS":
    case "TAX_RETURN":
      return "PROOF_RESIDENCE";
    case "OTHER":
    default:
      return "OTHER";
  }
}

/**
 * Calculates priority scores and sorts the task list.
 * Run this whenever the user loads their dashboard.
 */
export function prioritizeTasks(
  tasks: DocumentTask[],
  isDeceased: boolean = false
): PriorityTask[] {
  const today = new Date();
  const daysUntilDeadline = differenceInDays(PROGRAM_EXPIRATION_DATE, today);

  // Safety check: If we are past the deadline
  if (daysUntilDeadline <= 0) {
    console.warn("RECA Program has expired.");
  }

  // Check if Medical Pathology is missing
  const isMedicalMissing = tasks.some(
    (t) => t.type === "MEDICAL_PATHOLOGY" && t.status !== "RECEIVED"
  );

  const prioritized = tasks.map((task) => {
    const leadTime = LATENCY_MAP[task.type] || 7;
    let weight = CRITICALITY_WEIGHTS[task.type] || 1.0;

    // --- GOLDEN TRIAD LOGIC ---

    // 1. ID is a blocker for Medical Requests
    // If Medical is missing, ID becomes CRITICAL (it's the key to the lock)
    if (task.type === "ID_SCAN" && isMedicalMissing) {
      weight = 3.0; // Higher than Medical itself!
    }

    // 2. Death Certificate is a blocker for EVERYTHING if deceased
    // Hospitals won't talk to you without it.
    if (task.type === "VITAL_DEATH" && isDeceased) {
      weight = 3.5; // Absolute highest priority
    }

    // BASE SCORE: Lead Time * Weight
    let priorityScore = leadTime * weight;

    // DEADLINE MULTIPLIER (The "Panic Mode" Logic)
    const bufferDays = daysUntilDeadline - leadTime;

    if (bufferDays < 30) {
      priorityScore *= 5; // EXTREME DANGER
    } else if (bufferDays < 90) {
      priorityScore *= 2; // High Urgency
    }

    return {
      ...task,
      estimatedLeadTimeDays: leadTime,
      priorityScore,
      urgencyLabel: getUrgencyLabel(priorityScore),
    };
  });

  // Sort descending (Highest score first)
  return prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
}

function getUrgencyLabel(score: number): PriorityTask["urgencyLabel"] {
  if (score > 300) return "CRITICAL"; // Medical/Employment
  if (score > 100) return "HIGH"; // Vitals
  if (score > 20) return "NORMAL"; // Residence
  return "LOW"; // ID
}

// --- Usage Example ---
/*
const userTasks: DocumentTask[] = [
  { id: '1', type: 'ID_SCAN', category: 'IDENTITY', status: 'MISSING', label: 'Upload Driver License' },
  { id: '2', type: 'MEDICAL_PATHOLOGY', category: 'PATHOLOGY_REPORT', status: 'MISSING', label: 'Retrieve Cancer Diagnosis' },
  { id: '3', type: 'VITAL_BIRTH', category: 'OTHER', status: 'MISSING', label: 'Birth Certificate' }
];

const sorted = prioritizeTasks(userTasks);
// Result:
// 1. MEDICAL_PATHOLOGY (Score ~360) -> "Do this first because it takes 6 months"
// 2. VITAL_BIRTH (Score ~54)
// 3. ID_SCAN (Score ~0.5)
*/
