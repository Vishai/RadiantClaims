/**
 * Sentry Edge Runtime Configuration
 *
 * Captures errors from Edge Runtime (middleware, edge API routes)
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Sentry DSN - Get this from your Sentry project settings
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment-specific configuration
  environment: process.env.NODE_ENV,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Set edge context
  initialScope: (scope) => {
    scope.setTag("app", "radiant-claims");
    scope.setTag("component", "edge");
    return scope;
  },
});
