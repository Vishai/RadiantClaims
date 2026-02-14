import { toISODateString } from "./date-utils";

/**
 * Centralized User Data Management
 *
 * This utility manages user data persistence across all forms in the application.
 * It ensures users don't have to re-enter information they've already provided.
 *
 * Data sources (in priority order):
 * 1. Database (authenticated users)
 * 2. SessionStorage (current session)
 * 3. Form defaults
 */

export interface UserData {
  // Basic Info
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  // Address Info
  address1?: string;
  address2?: string;
  city?: string;
  county?: string;
  state?: string;
  postalCode?: string;

  // Additional Info
  dob?: string;

  // Metadata
  timestamp: number;
  source: "eligibility" | "intake" | "registration" | "database";
}

const STORAGE_KEY = "radiant_user_data";
const EXPIRY_HOURS = 24;

/**
 * Save user data to sessionStorage
 */
export function saveUserData(
  data: Partial<UserData>,
  source: UserData["source"] = "intake"
): void {
  try {
    const normalizedData = { ...data };
    if (normalizedData.dob) {
      normalizedData.dob = toISODateString(normalizedData.dob);
    }
    const existing = getUserData();
    const merged: UserData = {
      ...existing,
      ...normalizedData,
      timestamp: Date.now(),
      source,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error("[UserDataManager] Error saving user data:", error);
  }
}

/**
 * Get user data from sessionStorage
 */
export function getUserData(): UserData | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: UserData = JSON.parse(stored);

    // Check if data is expired
    const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
    const isExpired = Date.now() - data.timestamp > expiryMs;

    if (isExpired) {
      clearUserData();
      return null;
    }

    return data;
  } catch (error) {
    console.error("[UserDataManager] Error reading user data:", error);
    return null;
  }
}

/**
 * Clear user data from sessionStorage
 */
export function clearUserData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    // Also clear legacy key
    sessionStorage.removeItem("eligibility_user_data");
  } catch (error) {
    console.error("[UserDataManager] Error clearing user data:", error);
  }
}

/**
 * Merge data from legacy eligibility storage
 */
export function migrateLegacyData(): void {
  try {
    const legacyData = sessionStorage.getItem("eligibility_user_data");
    if (!legacyData) return;

    const parsed = JSON.parse(legacyData);

    // Convert legacy format to new format
    const nameParts = parsed.name?.trim().split(" ") || [];
    const userData: Partial<UserData> = {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" "),
      email: parsed.email,
      phone: parsed.phone,
    };

    saveUserData(userData, "eligibility");
    sessionStorage.removeItem("eligibility_user_data");
  } catch (error) {
    console.error("[UserDataManager] Error migrating legacy data:", error);
  }
}

/**
 * Prefill form with user data
 * Returns an object with available user data fields
 */
export function getPrefillData(): Partial<UserData> {
  // First, try to migrate legacy data
  migrateLegacyData();

  const data = getUserData();
  if (!data) return {};

  // Return all fields except metadata
  const { timestamp, source, ...userData } = data;
  return userData;
}

/**
 * Update specific fields without overwriting everything
 */
export function updateUserDataFields(fields: Partial<UserData>): void {
  const existing = getUserData();
  if (existing) {
    saveUserData({ ...existing, ...fields }, existing.source);
  } else {
    saveUserData(fields);
  }
}
