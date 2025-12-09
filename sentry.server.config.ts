/**
 * Sentry Server Configuration
 *
 * Captures errors and performance data from the server side (API routes, SSR)
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Sentry DSN - Get this from your Sentry project settings
  // Set in environment variable SENTRY_DSN
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  // Lower in production to reduce overhead
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Filter out errors that are not actionable
  beforeSend(event, hint) {
    // Filter out database connection errors during development
    if (
      process.env.NODE_ENV === "development" &&
      event.exception?.values?.[0]?.value?.includes("ECONNREFUSED")
    ) {
      return null;
    }

    return event;
  },

  // Set server context
  initialScope: (scope) => {
    scope.setTag("app", "radiant-claims");
    scope.setTag("component", "server");
    return scope;
  },
});
