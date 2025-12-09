/**
 * Sentry Client Configuration
 *
 * Captures errors and performance data from the browser/client side
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Sentry DSN - Get this from your Sentry project settings
  // Set in environment variable NEXT_PUBLIC_SENTRY_DSN
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Enable Replay feature to record user sessions
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content to protect PII
      maskAllText: true,
      // Block all media elements to protect privacy
      blockAllMedia: true,
    }),
  ],

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Filter out errors that are not actionable
  beforeSend(event, hint) {
    // Filter out browser extension errors
    if (event.exception?.values?.[0]?.value?.includes("chrome-extension://")) {
      return null;
    }

    // Filter out network errors from ad blockers
    if (event.exception?.values?.[0]?.value?.includes("Failed to fetch")) {
      return null;
    }

    return event;
  },

  // Set user context
  initialScope: (scope) => {
    scope.setTag("app", "radiant-claims");
    scope.setTag("component", "client");
    return scope;
  },
});
