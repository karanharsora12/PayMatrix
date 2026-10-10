import React from "react";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/pages/AccessDenied";

export interface PermissionGuardProps {
  /** Single permission string e.g. "employees.create" or "employees.view" */
  perm?: string;
  /** Array of permissions where ANY match grants access */
  anyPerm?: string[];
  /** Array of permissions where ALL must match */
  allPerms?: string[];
  /** Optional module + action convenience: e.g. module="employees", action="create" */
  module?: string;
  action?: string;
  /** Component to render if access denied. Defaults to null for buttons/inlines or <AccessDenied /> when used as page wrapper */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Checks whether user has permission.
 * Supports:
 * - Direct perm string: "employees.view"
 * - Dot and colon normalization: "employees:view" -> "employees.view"
 * - Action aliases: "list" -> "view", "add" -> "create", "update" -> "edit"
 * - Super admin wildcard bypass
 */
export function checkPermission(
  userPermissions: string[] = [],
  roles: string[] = [],
  permission: string,
): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  if (userPermissions.includes("*") || userPermissions.includes("*:*")) return true;

  const normalized = normalizePermission(permission);
  if (!normalized) return false;

  // Direct match
  if (userPermissions.includes(normalized)) return true;

  // Check aliases (e.g. employees.create vs employees.add)
  const [mod, act] = normalized.split(".");
  if (mod && act) {
    // Check wildcard module perm (e.g. "employees.*")
    if (userPermissions.includes(`${mod}.*`)) return true;

    // Check action synonyms
    const synonyms: Record<string, string[]> = {
      view: ["list", "get", "read"],
      create: ["add", "new"],
      edit: ["update", "modify"],
      delete: ["remove"],
      export: ["download"],
    };

    for (const [canonical, synList] of Object.entries(synonyms)) {
      if (act === canonical) {
        for (const syn of synList) {
          if (userPermissions.includes(`${mod}.${syn}`)) return true;
        }
      } else if (synList.includes(act)) {
        if (userPermissions.includes(`${mod}.${canonical}`)) return true;
      }
    }
  }

  return false;
}

export function normalizePermission(perm: string): string {
  if (!perm) return "";
  return perm.trim().toLowerCase().replace(/:/g, ".");
}

/**
 * PermissionGuard component to conditionally render children or fallback
 */
export function PermissionGuard({
  perm,
  anyPerm,
  allPerms,
  module,
  action,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  if (!user) return <>{fallback}</>;

  let isAllowed = false;

  if (module && action) {
    const targetPerm = `${module}.${action}`;
    isAllowed = hasPermission(targetPerm);
  } else if (perm) {
    isAllowed = hasPermission(perm);
  } else if (anyPerm && anyPerm.length > 0) {
    isAllowed = hasAnyPermission(anyPerm);
  } else if (allPerms && allPerms.length > 0) {
    isAllowed = hasAllPermissions(allPerms);
  } else {
    isAllowed = true;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Route-level guard that wraps page elements with AccessDenied fallback
 */
export function ProtectedRouteGuard({
  perm,
  anyPerm,
  module,
  children,
}: {
  perm?: string;
  anyPerm?: string[];
  module?: string;
  children: React.ReactNode;
}) {
  const required = perm || (module ? `${module}.view` : anyPerm?.[0] || "");
  return (
    <PermissionGuard
      perm={perm}
      anyPerm={anyPerm}
      module={module}
      action="view"
      fallback={<AccessDenied requiredPermission={required} />}
    >
      {children}
    </PermissionGuard>
  );
}
