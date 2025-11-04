import { UserRole } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Permission system for attorney portal
 * Implements principle of least privilege and multi-tenant isolation
 */

export type Permission =
  | "claimant:view"
  | "claimant:view-all" // Admin only
  | "claimant:update"
  | "claimant:assign"
  | "document:view"
  | "document:download"
  | "document:approve"
  | "document:reject"
  | "comment:create"
  | "comment:view"
  | "comment:view-internal" // Staff only
  | "review:approve"
  | "review:request-revision"
  | "firm:manage"
  | "firm:view-users"
  | "user:invite"
  | "user:remove";

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CUSTOMER: [
    "claimant:view", // Only their own claims
    "document:view", // Only their own documents
    "document:download", // Only their own documents
  ],
  ATTORNEY: [
    "claimant:view", // Claimants assigned to their firm
    "document:view",
    "document:download",
    "document:approve",
    "document:reject",
    "comment:create",
    "comment:view",
    "review:approve",
    "review:request-revision",
  ],
  FIRM_ADMIN: [
    "claimant:view",
    "document:view",
    "document:download",
    "document:approve",
    "document:reject",
    "comment:create",
    "comment:view",
    "review:approve",
    "review:request-revision",
    "firm:manage",
    "firm:view-users",
    "user:invite",
    "user:remove",
  ],
  ADMIN: [
    "claimant:view",
    "claimant:view-all",
    "claimant:update",
    "claimant:assign",
    "document:view",
    "document:download",
    "document:approve",
    "document:reject",
    "comment:create",
    "comment:view",
    "comment:view-internal",
    "review:approve",
    "review:request-revision",
    "firm:manage",
    "firm:view-users",
    "user:invite",
    "user:remove",
  ],
  STAFF_REVIEWER: [
    "claimant:view",
    "claimant:view-all",
    "document:view",
    "document:download",
    "comment:create",
    "comment:view",
    "review:approve",
    "review:request-revision",
  ],
  SENIOR_REVIEWER: [
    "claimant:view",
    "claimant:view-all",
    "claimant:update",
    "document:view",
    "document:download",
    "document:approve",
    "document:reject",
    "comment:create",
    "comment:view",
    "comment:view-internal",
    "review:approve",
    "review:request-revision",
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if user can access a specific claimant
 * Implements multi-tenant isolation for attorneys
 */
export async function canAccessClaimant(
  _userId: string,
  claimantId: string
): Promise<boolean> {
  const session = await getServerAuthSession();
  if (!session?.user) return false;

  const user = session.user;

  // Admins can access all claimants
  if (user.role === "ADMIN") return true;

  // Customers can only access their own claimants
  if (user.role === "CUSTOMER") {
    const claimant = await db.claimant.findFirst({
      where: {
        id: claimantId,
        userId: user.id,
      },
    });
    return !!claimant;
  }

  // Attorneys can only access claimants assigned to their firm
  if (user.role === "ATTORNEY" || user.role === "FIRM_ADMIN") {
    if (!user.firmId) return false;

    const assignment = await db.claimantAssignment.findFirst({
      where: {
        claimantId,
        firmId: user.firmId,
      },
    });
    return !!assignment;
  }

  return false;
}

/**
 * Check if user can access a specific document
 * Inherits from claimant access permissions
 */
export async function canAccessDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const session = await getServerAuthSession();
  if (!session?.user) return false;

  // Get the document and its associated claimant
  const uploadedFile = await db.uploadedFile.findUnique({
    where: { id: documentId },
    include: {
      intakeSession: {
        include: {
          claimant: true,
        },
      },
    },
  });

  if (!uploadedFile?.intakeSession?.claimant) return false;

  // Check claimant access
  return canAccessClaimant(userId, uploadedFile.intakeSession.claimant.id);
}

/**
 * Get all claimants accessible by the current user
 * Enforces multi-tenant isolation
 */
export async function getAccessibleClaimants() {
  const session = await getServerAuthSession();
  if (!session?.user) return [];

  const user = session.user;

  // Admins see all claimants
  if (user.role === "ADMIN") {
    return db.claimant.findMany({
      include: {
        intakeSession: {
          include: {
            uploadedFiles: true,
          },
        },
        firmAssignments: {
          include: {
            firm: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  // Customers see only their own claimants
  if (user.role === "CUSTOMER") {
    return db.claimant.findMany({
      where: {
        userId: user.id,
      },
      include: {
        intakeSession: {
          include: {
            uploadedFiles: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  // Attorneys see only claimants assigned to their firm
  if ((user.role === "ATTORNEY" || user.role === "FIRM_ADMIN") && user.firmId) {
    return db.claimant.findMany({
      where: {
        firmAssignments: {
          some: {
            firmId: user.firmId,
          },
        },
      },
      include: {
        intakeSession: {
          include: {
            uploadedFiles: true,
          },
        },
        firmAssignments: {
          where: {
            firmId: user.firmId,
          },
          include: {
            firm: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  return [];
}

/**
 * Require specific role(s) - throws if user doesn't match
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    throw new Error("Unauthorized - No session");
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error(
      `Forbidden - Requires role: ${allowedRoles.join(" or ")}`
    );
  }

  return { user: session.user };
}

/**
 * Require specific permission(s) - throws if user doesn't have permission
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    throw new Error("Unauthorized - No session");
  }

  if (!hasPermission(session.user.role, permission)) {
    throw new Error(`Forbidden - Missing permission: ${permission}`);
  }

  return { user: session.user };
}

/**
 * Ensure user has accepted required policies
 */
export async function hasAcceptedPolicies(
  userId: string,
  requiredPolicies: string[]
): Promise<boolean> {
  const acceptances = await db.policyAcceptance.findMany({
    where: {
      userId,
      policyType: {
        in: requiredPolicies as any[],
      },
    },
  });

  return acceptances.length === requiredPolicies.length;
}
