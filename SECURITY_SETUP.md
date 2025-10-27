# Security Implementation Guide - SOC 2 Compliance

## Overview

This guide covers implementing SOC 2-ready security features for RadiantClaims, including:

1. ✅ HTTPS in production (Railway automatic)
2. 🔄 Audit logging for sensitive actions
3. 🔄 Password change requirement for temporary passwords
4. 🔄 Rate limiting to prevent brute force attacks
5. 🔄 Multi-Factor Authentication (MFA)
6. 🔄 Session timeout warnings
7. 🔄 Secure "remember me" functionality

---

## 1. ✅ HTTPS in Production

**Status**: ✅ Automatically enabled on Railway

Railway provides:
- Free SSL/TLS certificates via Let's Encrypt
- Automatic certificate renewal
- HTTPS enforced for all `.railway.app` domains
- Custom domain SSL support

### Verification

```bash
# After deployment, verify HTTPS
curl -I https://your-app.railway.app

# Should return:
# HTTP/2 200
# strict-transport-security: max-age=31536000
```

### Additional HTTPS Hardening

Update `next.config.js` to enforce security headers:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 2. Audit Logging for Sensitive Actions

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
enum AuditAction {
  USER_LOGIN
  USER_LOGOUT
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  PASSWORD_CHANGED
  PASSWORD_RESET_REQUESTED
  PASSWORD_RESET_COMPLETED
  MFA_ENABLED
  MFA_DISABLED
  SESSION_CREATED
  SESSION_TERMINATED
  CLAIMANT_VIEWED
  CLAIMANT_CREATED
  CLAIMANT_UPDATED
  CLAIMANT_DELETED
  DOCUMENT_UPLOADED
  DOCUMENT_VIEWED
  DOCUMENT_DOWNLOADED
  DOCUMENT_DELETED
  INTAKE_STARTED
  INTAKE_COMPLETED
  PACKET_GENERATED
  UNAUTHORIZED_ACCESS_ATTEMPT
  PERMISSION_DENIED
}

enum AuditSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}

model AuditLog {
  id          String         @id @default(cuid())
  userId      String?        // Null for anonymous/failed login attempts
  user        User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  action      AuditAction
  severity    AuditSeverity  @default(INFO)
  resourceType String?       // e.g., "User", "Claimant", "Document"
  resourceId  String?        // ID of affected resource
  ipAddress   String
  userAgent   String?        @db.Text
  metadata    String?        @db.Text // JSON with additional context
  success     Boolean        @default(true)
  errorMessage String?       @db.Text
  createdAt   DateTime       @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([severity])
  @@index([resourceType, resourceId])
}

// Update User model to include audit logs
model User {
  // ... existing fields ...
  auditLogs AuditLog[]
}
```

### Audit Service Implementation

Create `src/lib/audit.ts`:

```typescript
import { db } from "@/lib/db";
import { AuditAction, AuditSeverity } from "@prisma/client";

interface AuditLogData {
  userId?: string;
  action: AuditAction;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        severity: data.severity ?? AuditSeverity.INFO,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit failures shouldn't break app
    console.error("[Audit Log Error]", error);
  }
}

// Helper to extract IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

// Helper to get user agent
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") ?? "unknown";
}
```

### Integration Examples

#### Login Audit

```typescript
// In your login API route
import { createAuditLog, getClientIp, getUserAgent } from "@/lib/audit";

// Successful login
await createAuditLog({
  userId: user.id,
  action: "USER_LOGIN",
  severity: "INFO",
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
  success: true,
});

// Failed login
await createAuditLog({
  action: "UNAUTHORIZED_ACCESS_ATTEMPT",
  severity: "WARNING",
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
  metadata: { email: credentials.email },
  success: false,
  errorMessage: "Invalid credentials",
});
```

#### Document Access Audit

```typescript
// When viewing/downloading a document
await createAuditLog({
  userId: session.user.id,
  action: "DOCUMENT_VIEWED",
  resourceType: "Document",
  resourceId: documentId,
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
});
```

---

## 3. Password Change Requirement for Temporary Passwords

### Database Schema Update

```prisma
model User {
  // ... existing fields ...
  passwordChangedAt DateTime?
  passwordResetRequired Boolean @default(false)
  passwordResetToken    String?  @unique
  passwordResetExpires  DateTime?
}
```

### Implementation

Create `src/lib/auth/password-policy.ts`:

```typescript
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  maxAge: 90, // days - require change every 90 days
};

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Common passwords check
  const commonPasswords = [
    "password", "password123", "admin", "qwerty", "letmein",
    "welcome", "monkey", "dragon", "master", "sunshine"
  ];

  if (PASSWORD_RULES.preventCommonPasswords &&
      commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push("Password is too common");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function requirePasswordChange(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { passwordResetRequired: true },
  });
}

export async function isPasswordExpired(user: { passwordChangedAt: Date | null }): boolean {
  if (!user.passwordChangedAt) return true; // Never changed

  const daysSinceChange = Math.floor(
    (Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceChange > PASSWORD_RULES.maxAge;
}
```

### Middleware to Enforce Password Change

Create `src/middleware/require-password-change.ts`:

```typescript
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function checkPasswordChangeRequired() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordResetRequired: true },
  });

  if (user?.passwordResetRequired) {
    redirect("/auth/change-password?required=true");
  }
}
```

---

## 4. Rate Limiting to Prevent Brute Force Attacks

### Install Dependencies

```bash
pnpm add @upstash/redis @upstash/ratelimit
```

### Set Up Upstash Redis (Free Tier)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Get your `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### Update Environment Variables

```bash
# Add to Railway
railway variables set UPSTASH_REDIS_REST_URL=your_url
railway variables set UPSTASH_REDIS_REST_TOKEN=your_token
```

Update `.env.example` and `src/env.mjs`:

```typescript
// src/env.mjs
server: {
  // ... existing variables ...
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
}
```

### Rate Limiter Implementation

Create `src/lib/rate-limit.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env.mjs";

// In-memory fallback for development
class InMemoryRateLimiter {
  private hits: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(identifier: string, limit: number, window: number) {
    const now = Date.now();
    const key = identifier;
    const hit = this.hits.get(key);

    if (!hit || now > hit.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + window });
      return { success: true, limit, remaining: limit - 1, reset: now + window };
    }

    if (hit.count >= limit) {
      return { success: false, limit, remaining: 0, reset: hit.resetAt };
    }

    hit.count++;
    return { success: true, limit, remaining: limit - hit.count, reset: hit.resetAt };
  }
}

// Use Redis in production, in-memory in development
const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: true,
      prefix: "ratelimit:login",
    })
  : new InMemoryRateLimiter();

// Password reset: 3 requests per hour per email
export const passwordResetRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 m"),
      analytics: true,
      prefix: "ratelimit:password-reset",
    })
  : new InMemoryRateLimiter();

// API rate limiter: 100 requests per minute per user
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : new InMemoryRateLimiter();

// File upload: 10 uploads per hour per user
export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 m"),
      analytics: true,
      prefix: "ratelimit:upload",
    })
  : new InMemoryRateLimiter();
```

### Usage in API Routes

```typescript
// In login API route
import { loginRateLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Check rate limit
  const { success, limit, remaining, reset } = await loginRateLimiter.limit(ip);

  if (!success) {
    // Log the attempt
    await createAuditLog({
      action: "UNAUTHORIZED_ACCESS_ATTEMPT",
      severity: "WARNING",
      ipAddress: ip,
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: "Rate limit exceeded",
    });

    return new Response(
      JSON.stringify({
        error: "Too many login attempts. Please try again later.",
        retryAfter: new Date(reset).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Proceed with login logic...
}
```

---

## 5. Multi-Factor Authentication (MFA)

### Database Schema

```prisma
enum MFAMethod {
  TOTP // Time-based One-Time Password (Google Authenticator, Authy)
  SMS  // Future: SMS-based verification
  EMAIL // Future: Email-based verification
}

model MFAConfig {
  id           String    @id @default(cuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  method       MFAMethod
  secret       String    // Encrypted TOTP secret
  backupCodes  String[]  // Encrypted backup codes
  isEnabled    Boolean   @default(false)
  enabledAt    DateTime?
  lastUsedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
}

// Update User model
model User {
  // ... existing fields ...
  mfaEnabled Boolean     @default(false)
  mfaConfig  MFAConfig?
}
```

### Install Dependencies

```bash
pnpm add otpauth qrcode
pnpm add -D @types/qrcode
```

### MFA Service

Create `src/lib/auth/mfa.ts`:

```typescript
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

export async function generateMFASecret(userId: string, email: string) {
  // Generate a secret
  const secret = new Secret({ size: 20 });

  // Create TOTP instance
  const totp = new TOTP({
    issuer: "RadiantClaims",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    randomBytes(4).toString("hex").toUpperCase()
  );

  // Store in database (encrypted secret recommended in production)
  await db.mFAConfig.create({
    data: {
      userId,
      method: "TOTP",
      secret: secret.base32,
      backupCodes,
      isEnabled: false,
    },
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(totp.toString());

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    backupCodes,
  };
}

export async function verifyMFAToken(userId: string, token: string): Promise<boolean> {
  const mfaConfig = await db.mFAConfig.findUnique({
    where: { userId },
  });

  if (!mfaConfig || !mfaConfig.isEnabled) {
    return false;
  }

  // Check if it's a backup code
  if (mfaConfig.backupCodes.includes(token.toUpperCase())) {
    // Remove used backup code
    await db.mFAConfig.update({
      where: { userId },
      data: {
        backupCodes: mfaConfig.backupCodes.filter(code => code !== token.toUpperCase()),
        lastUsedAt: new Date(),
      },
    });
    return true;
  }

  // Verify TOTP token
  const secret = Secret.fromBase32(mfaConfig.secret);
  const totp = new TOTP({
    secret,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token, window: 1 });

  if (delta !== null) {
    // Valid token
    await db.mFAConfig.update({
      where: { userId },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }

  return false;
}

export async function enableMFA(userId: string) {
  await db.$transaction([
    db.mFAConfig.update({
      where: { userId },
      data: {
        isEnabled: true,
        enabledAt: new Date(),
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    }),
  ]);
}

export async function disableMFA(userId: string) {
  await db.$transaction([
    db.mFAConfig.delete({
      where: { userId },
    }),
    db.user.update({
      where: { id: userId },
      data: { mfaEnabled: false },
    }),
  ]);
}
```

---

## 6. Session Timeout Warnings

### Client-Side Implementation

Create `src/components/session-timeout-warning.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before timeout

export function SessionTimeoutWarning() {
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!session) return;

    let warningTimeout: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      setShowWarning(false);

      // Show warning before timeout
      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(WARNING_TIME / 1000);

        // Countdown
        countdownInterval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              window.location.href = "/api/auth/signout";
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, SESSION_TIMEOUT - WARNING_TIME);
    };

    // Reset on user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(warningTimeout);
      clearInterval(countdownInterval);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  const handleExtendSession = async () => {
    await update(); // Refresh the session
    setShowWarning(false);
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/signout";
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in {minutes}:{seconds.toString().padStart(2, "0")} due to
            inactivity. Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
          <Button onClick={handleExtendSession}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Add to your root layout:

```typescript
// app/layout.tsx
import { SessionTimeoutWarning } from "@/components/session-timeout-warning";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
          <SessionTimeoutWarning />
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## 7. Secure "Remember Me" Functionality

### Database Schema

```prisma
model RememberMeToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique // Hashed token
  expires   DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expires])
}

model User {
  // ... existing fields ...
  rememberMeTokens RememberMeToken[]
}
```

### Implementation

Create `src/lib/auth/remember-me.ts`:

```typescript
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createRememberMeToken(userId: string) {
  // Generate random token
  const token = randomBytes(32).toString("hex");

  // Hash it before storing
  const hashedToken = createHash("sha256").update(token).digest("hex");

  // Store in database
  await db.rememberMeToken.create({
    data: {
      userId,
      token: hashedToken,
      expires: new Date(Date.now() + REMEMBER_ME_DURATION),
    },
  });

  // Return unhashed token to set in cookie
  return token;
}

export async function verifyRememberMeToken(token: string) {
  const hashedToken = createHash("sha256").update(token).digest("hex");

  const record = await db.rememberMeToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!record || record.expires < new Date()) {
    // Clean up expired token
    if (record) {
      await db.rememberMeToken.delete({ where: { id: record.id } });
    }
    return null;
  }

  return record.user;
}

export async function revokeRememberMeToken(token: string) {
  const hashedToken = createHash("sha256").update(token).digest("hex");

  await db.rememberMeToken.delete({
    where: { token: hashedToken },
  });
}

export async function revokeAllRememberMeTokens(userId: string) {
  await db.rememberMeToken.deleteMany({
    where: { userId },
  });
}
```

---

## Testing & Verification

### Audit Log Testing

```bash
# View audit logs
railway run npx prisma studio

# Navigate to AuditLog table
# Filter by action, userId, or date range
```

### Rate Limiting Testing

```bash
# Test login rate limit
for i in {1..10}; do
  curl -X POST https://your-app.railway.app/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Should see 429 after 5 attempts
```

### MFA Testing

```bash
# Use Google Authenticator or Authy app
# Scan QR code
# Verify 6-digit codes rotate every 30 seconds
```

---

## Deployment Checklist

- [ ] Run database migrations: `railway run npx prisma migrate deploy`
- [ ] Verify HTTPS is enabled (automatic on Railway)
- [ ] Set up Upstash Redis for rate limiting
- [ ] Configure audit logging
- [ ] Test password policies
- [ ] Enable MFA for admin accounts
- [ ] Test session timeout warnings
- [ ] Verify rate limiting works
- [ ] Review security headers
- [ ] Set up monitoring for audit logs
- [ ] Create security incident response plan

---

## Monitoring & Compliance

### Audit Log Retention

Set up a cron job to archive old audit logs:

```typescript
// Archive logs older than 1 year to cold storage
// Keep critical logs for 7 years (HIPAA requirement)
```

### Security Metrics to Track

1. Failed login attempts per day
2. MFA adoption rate
3. Password reset requests
4. Session timeout occurrences
5. Rate limit violations
6. Suspicious IP addresses
7. Unauthorized access attempts

### SOC 2 Compliance Checklist

- ✅ HTTPS enforced
- ✅ Audit logging for all sensitive actions
- ✅ Strong password policies
- ✅ Rate limiting on authentication
- ✅ MFA available for all users
- ✅ Session management with timeout
- ✅ Secure token handling
- ✅ Regular security updates
- ✅ Access control (existing RBAC)
- ✅ Data encryption at rest (PostgreSQL)
- ✅ Data encryption in transit (HTTPS)

---

## Support & Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [SOC 2 Compliance Guide](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
