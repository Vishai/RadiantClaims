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

/**
 * Create an audit log entry for security and compliance tracking
 * This function never throws - audit failures are logged but don't break the app
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
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

/**
 * Extract client IP address from various header sources
 * Handles proxies, load balancers, and direct connections
 */
export function getClientIp(request: Request): string {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain (original client)
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  // Check for real IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for direct connections
  return "unknown";
}

/**
 * Get user agent string from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") ?? "unknown";
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return db.auditLog.findMany({
    where: {
      userId: filters.userId,
      action: filters.action,
      severity: filters.severity,
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: filters.limit ?? 100,
  });
}

/**
 * Get suspicious activity (failed logins, unauthorized access)
 */
export async function getSuspiciousActivity(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db.auditLog.findMany({
    where: {
      OR: [
        { action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT },
        { action: AuditAction.PERMISSION_DENIED },
        {
          action: AuditAction.USER_LOGIN,
          success: false,
        },
      ],
      createdAt: {
        gte: since,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await db.auditLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: since,
      },
    },
    select: {
      action: true,
      createdAt: true,
      ipAddress: true,
    },
  });

  // Group by action
  const actionCounts = logs.reduce(
    (acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get unique IPs
  const uniqueIps = new Set(logs.map((log) => log.ipAddress));

  return {
    totalActions: logs.length,
    actionCounts,
    uniqueIps: Array.from(uniqueIps),
    lastActivity: logs[0]?.createdAt,
  };
}
