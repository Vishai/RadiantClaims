import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env.mjs";

// In-memory fallback for development
class InMemoryRateLimiter {
  private hits: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const key = identifier;
    const hit = this.hits.get(key);

    if (!hit || now > hit.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + window });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + window,
      };
    }

    if (hit.count >= limit) {
      return { success: false, limit, remaining: 0, reset: hit.resetAt };
    }

    hit.count++;
    return {
      success: true,
      limit,
      remaining: limit - hit.count,
      reset: hit.resetAt,
    };
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.hits.forEach((hit, key) => {
      if (now > hit.resetAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.hits.delete(key));
  }
}

// Use Redis in production, in-memory in development
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// In-memory instances for fallback
const loginMemoryLimiter = new InMemoryRateLimiter();
const passwordResetMemoryLimiter = new InMemoryRateLimiter();
const apiMemoryLimiter = new InMemoryRateLimiter();
const uploadMemoryLimiter = new InMemoryRateLimiter();

// Clean up in-memory limiters every 5 minutes
if (!redis) {
  setInterval(
    () => {
      loginMemoryLimiter.cleanup();
      passwordResetMemoryLimiter.cleanup();
      apiMemoryLimiter.cleanup();
      uploadMemoryLimiter.cleanup();
    },
    5 * 60 * 1000
  );
}

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:login",
    })
  : {
      limit: (identifier: string) =>
        loginMemoryLimiter.limit(identifier, 5, 15 * 60 * 1000),
    };

// Password reset: 3 requests per hour per email
export const passwordResetRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      analytics: true,
      prefix: "ratelimit:password-reset",
    })
  : {
      limit: (identifier: string) =>
        passwordResetMemoryLimiter.limit(identifier, 3, 60 * 60 * 1000),
    };

// API rate limiter: 100 requests per minute per identifier
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : {
      limit: (identifier: string) =>
        apiMemoryLimiter.limit(identifier, 100, 60 * 1000),
    };

// Chat (expensive): 20 requests per minute per identifier
export const chatRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "ratelimit:chat",
    })
  : {
      limit: (identifier: string) =>
        apiMemoryLimiter.limit(identifier, 20, 60 * 1000),
    };

// Feedback (cheap): 200 requests per minute per identifier
export const chatFeedbackRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 m"),
      analytics: true,
      prefix: "ratelimit:chat-feedback",
    })
  : {
      limit: (identifier: string) =>
        apiMemoryLimiter.limit(identifier, 200, 60 * 1000),
    };

// Escalation (email spam risk): 10 requests per hour per identifier
export const chatEscalationRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 m"),
      analytics: true,
      prefix: "ratelimit:chat-escalation",
    })
  : {
      limit: (identifier: string) =>
        apiMemoryLimiter.limit(identifier, 10, 60 * 60 * 1000),
    };

// File upload: 10 uploads per hour per user
export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 m"),
      analytics: true,
      prefix: "ratelimit:upload",
    })
  : {
      limit: (identifier: string) =>
        uploadMemoryLimiter.limit(identifier, 10, 60 * 60 * 1000),
    };

/**
 * Helper to create a rate limit response
 */
export function createRateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: new Date(result.reset).toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}
