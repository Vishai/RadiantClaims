/**
 * OCR Configuration
 *
 * Centralized configuration for the multi-tier OCR system.
 * Controls which tiers are enabled and validates credentials.
 */

/**
 * OCR System Configuration
 */
export const ocrConfig = {
  // Tier enable flags (default to true if not specified)
  enableTier1:
    process.env.OCR_ENABLE_TIER_1 !== "false" &&
    process.env.OCR_ENABLE_TIER_1 !== "0",
  enableTier2:
    process.env.OCR_ENABLE_TIER_2 !== "false" &&
    process.env.OCR_ENABLE_TIER_2 !== "0",
  enableTier3:
    process.env.OCR_ENABLE_TIER_3 !== "false" &&
    process.env.OCR_ENABLE_TIER_3 !== "0",
  enableTier4:
    process.env.OCR_ENABLE_TIER_4 !== "false" &&
    process.env.OCR_ENABLE_TIER_4 !== "0",

  // Minimum characters threshold
  minCharsThreshold: parseInt(process.env.OCR_MIN_CHARS_THRESHOLD || "50", 10),

  // Credential checks
  hasTextractCredentials: (): boolean => {
    return !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );
  },

  hasGoogleVisionCredentials: (): boolean => {
    return !!(
      process.env.GOOGLE_CLOUD_PROJECT_ID &&
      (process.env.GOOGLE_CLOUD_CREDENTIALS ||
        process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64)
    );
  },

  hasOpenAICredentials: (): boolean => {
    return !!process.env.OPENAI_API_KEY;
  },

  // Get configuration summary
  getSummary: () => {
    const summary = {
      tier1: {
        enabled: ocrConfig.enableTier1,
        name: "PDF.js/pdf-parse",
        cost: "$0.00",
        status: ocrConfig.enableTier1 ? "✅ Enabled" : "❌ Disabled",
      },
      tier2: {
        enabled: ocrConfig.enableTier2 && ocrConfig.hasTextractCredentials(),
        name: "AWS Textract",
        cost: "$0.0015/page",
        status: (() => {
          if (!ocrConfig.enableTier2) return "❌ Disabled";
          if (!ocrConfig.hasTextractCredentials())
            return "⚠️  Disabled (no credentials)";
          return "✅ Enabled";
        })(),
      },
      tier3: {
        enabled:
          ocrConfig.enableTier3 && ocrConfig.hasGoogleVisionCredentials(),
        name: "Google Cloud Vision",
        cost: "$0.0015/page",
        status: (() => {
          if (!ocrConfig.enableTier3) return "❌ Disabled";
          if (!ocrConfig.hasGoogleVisionCredentials())
            return "⚠️  Disabled (no credentials)";
          return "✅ Enabled";
        })(),
      },
      tier4: {
        enabled: ocrConfig.enableTier4 && ocrConfig.hasOpenAICredentials(),
        name: "GPT-4o Vision",
        cost: "~$0.025/doc",
        status: (() => {
          if (!ocrConfig.enableTier4) return "❌ Disabled";
          if (!ocrConfig.hasOpenAICredentials())
            return "⚠️  Disabled (no API key)";
          return "✅ Enabled";
        })(),
      },
      minCharsThreshold: ocrConfig.minCharsThreshold,
    };

    return summary;
  },

  // Log configuration on startup (call this in your app initialization)
  logConfiguration: () => {
    const summary = ocrConfig.getSummary();

    console.log("\n🔧 OCR Multi-Tier Configuration:");
    console.log("─".repeat(80));
    console.log(`  Tier 1 (${summary.tier1.name}): ${summary.tier1.status}`);
    console.log(`  Tier 2 (${summary.tier2.name}): ${summary.tier2.status}`);
    console.log(`  Tier 3 (${summary.tier3.name}): ${summary.tier3.status}`);
    console.log(`  Tier 4 (${summary.tier4.name}): ${summary.tier4.status}`);
    console.log(`  Min chars threshold: ${summary.minCharsThreshold}`);
    console.log("─".repeat(80) + "\n");
  },
};

// Log configuration in development
if (process.env.NODE_ENV === "development") {
  // Don't log immediately - wait for app to be ready
  // This can be called from your app's initialization code
}
