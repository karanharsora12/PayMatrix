import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useRoles,
  useAllPermissions,
  useCreateRole,
  useUpdateRole,
} from "@/hooks/useUsersRoles";
import { rolesApi } from "@/api/users";
import { useAlert } from "@/components/common/AlertProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Users,
  Key,
  Save,
  Plus,
  UserPlus,
  Search,
  Lock,
  CheckCircle2,
  XCircle,
  LayoutList,
} from "lucide-react";
import type { ColDef } from "ag-grid-community";

// ─── Module Enhancements ──────────────────────────────────────────────────
const MODULE_ENHANCEMENTS: Record<string, { label: string; desc: string }> = {
  employees: {
    label: "Employee Management",
    desc: "Access employee records, documents, and profile management.",
  },
  salary: {
    label: "Salary & Payroll",
    desc: "Define and manage salary component structures and payroll runs.",
  },
  payroll: {
    label: "Payroll Processing",
    desc: "Handle payslip generation and distribution.",
  },
  leave: {
    label: "Leave Management",
    desc: "Handle leave requests, approvals, and leave types.",
  },
  attendance: {
    label: "Attendance & Shifts",
    desc: "Track attendance, manage shifts and holidays.",
  },
  reports: {
    label: "Reports",
    desc: "Access salary registers, payslip summaries, and statutory reports.",
  },
  settings: {
    label: "System Settings",
    desc: "Company, branch, department, and compliance configuration.",
  },
  users: { label: "User Management", desc: "Manage user accounts and access." },
  roles: {
    label: "Role Management",
    desc: "Configure roles and assign permissions.",
  },
  documents: {
    label: "Documents",
    desc: "Manage company and employee documents.",
  },
  branches: { label: "Branches", desc: "Manage company branches." },
  departments: { label: "Departments", desc: "Manage departments." },
  designations: {
    label: "Designations",
    desc: "Manage employee designations.",
  },
};

export default function UsersRoles() {
  const { user: authUser, hasPermission } = useAuth();
  const { success: alertSuccess, error: alertError } = useAlert();
  const qc = useQueryClient();

  const canManage =
    authUser?.roles?.includes("SUPER_ADMIN") ||
    hasPermission("users.manage") ||
    hasPermission("users_roles:manage");

  // ── Data Fetching
  const {
    data: rolesResp,
    isLoading: rolesLoading,
    refetch: refetchRoles,
  } = useRoles();
  const { data: rawPerms = [] } = useAllPermissions();

  const roles: any[] = useMemo(
    () => (rolesResp as any)?.data || [],
    [rolesResp],
  );
  const permissionsList: any[] = useMemo(() => rawPerms || [], [rawPerms]);

  // Group real permissions by module
  const permsByModule = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of permissionsList) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  }, [permissionsList]);

  // ── Mutations
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  // ── UI State
  const [activeRoleId, setActiveRoleId] = useState<string>("");
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // Per-role dirty permissions state (tracks toggles)
  const [dirtyPerms, setDirtyPerms] = useState<Record<string, Set<string>>>({});

  // Role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  // Set default active role once loaded
  if (!activeRoleId && roles.length > 0) {
    setActiveRoleId(roles[0].id);
  }

  const activeRole = useMemo(
    () => roles.find((r: any) => r.id === activeRoleId) || roles[0],
    [roles, activeRoleId],
  );

  // ── Permission Logic
  const committedGrantedIds = useMemo(() => {
    if (!activeRole) return new Set<string>();
    return new Set<string>(
      (activeRole.rolePermissions || []).map(
        (rp: any) => rp.permissionId || rp.permission?.id,
      ),
    );
  }, [activeRole]);

  const workingGrantedIds = useMemo(() => {
    if (!activeRole) return new Set<string>();
    const dirty = dirtyPerms[activeRole.id];
    if (!dirty) return committedGrantedIds;
    return dirty;
  }, [activeRole, dirtyPerms, committedGrantedIds]);

  const isDirty = useMemo(() => {
    if (!activeRole) return false;
    return !!dirtyPerms[activeRole.id];
  }, [activeRole, dirtyPerms]);

  // Handlers
  const togglePermission = (permId: string) => {
    if (!activeRole || activeRole.isSystemRole || !canManage) return;
    setDirtyPerms((prev) => {
      const base = prev[activeRole.id] ?? new Set(committedGrantedIds);
      const next = new Set(base);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return { ...prev, [activeRole.id]: next };
    });
  };

  async function handleSave() {
    if (!activeRole || !isDirty) return;
    setIsSavingPerms(true);
    try {
      const permissionIds = Array.from(workingGrantedIds);
      await rolesApi.update(activeRole.id, { permissionIds } as any);
      alertSuccess(`Permissions saved for "${activeRole.name}".`);
      setDirtyPerms((prev) => {
        const next = { ...prev };
        delete next[activeRole.id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["roles"] });
    } catch {
      alertError("Failed to save permissions.");
    } finally {
      setIsSavingPerms(false);
    }
  }

  function openCreateRole() {
    setEditingRole(null);
    setRoleName("");
    setRoleSlug("");
    setRoleDesc("");
    setRoleDialogOpen(true);
  }

  async function handleSaveRole() {
    if (!roleName.trim() || !roleSlug.trim()) return;
    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          data: { name: roleName.trim(), description: roleDesc.trim() },
        });
        alertSuccess("Role updated.");
      } else {
        const created = await createRole.mutateAsync({
          name: roleName.trim(),
          slug: roleSlug.trim().toUpperCase(),
          description: roleDesc.trim(),
        });
        alertSuccess("Role created.");
        setActiveRoleId((created as any)?.id || "");
      }
      setRoleDialogOpen(false);
      refetchRoles();
    } catch (e: any) {
      alertError(e?.response?.data?.error?.message || "Failed to save role.");
    }
  }

  return (
    <div className="space-y-0">
      <ListingCard>
        <ListingHeader title="Role Management" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">
          {/* Roles sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {rolesLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-md bg-muted animate-pulse"
                  />
                ))
              : roles.map((role: any) => {
                  const isActive = activeRoleId === role.id;
                  const Icon = role.isSystemRole ? ShieldAlert : ShieldCheck;

                  return (
                    <button
                      key={role.id}
                      onClick={() => setActiveRoleId(role.id)}
                      className={`w-full text-left rounded-md border px-3 py-3 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${isActive ? (role.isSystemRole ? "text-rose-500" : "text-primary") : "text-muted-foreground"}`}
                          />
                          <span
                            className={`font-semibold text-sm truncate ${isActive ? "text-primary" : "text-foreground"}`}
                          >
                            {role.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isDirty && activeRole?.id === role.id && (
                            <span
                              className="h-2 w-2 rounded-full bg-amber-400"
                              title="Unsaved changes"
                            />
                          )}
                          {role.isSystemRole && (
                            <Lock className="h-3 w-3 text-muted-foreground/60" />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                        {role.description || "No description provided."}
                      </p>
                    </button>
                  );
                })}

            {canManage && (
              <button
                onClick={openCreateRole}
                className="w-full text-left rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> New Custom Role
              </button>
            )}
          </div>

          {/* Permissions matrix */}
          <div className="lg:col-span-9">
            {!activeRole ? (
              <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-md text-muted-foreground text-sm">
                Select a role to manage its permissions
              </div>
            ) : (
              <div className="rounded-md border border-border bg-card shadow-xs overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">
                        {activeRole.name} — Permission Matrix
                      </span>
                      {activeRole.isSystemRole && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1 py-0 h-5"
                        >
                          <Lock className="h-2.5 w-2.5" /> System-Locked
                        </Badge>
                      )}
                      {isDirty && (
                        <Badge variant="warning" className="text-[10px] py-0 h-5">
                          Unsaved Changes
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {activeRole.description ||
                        "Manage permissions for this role."}
                    </p>
                  </div>
                  {canManage && !activeRole.isSystemRole && (
                    <Button
                      size="sm"
                      className="h-8 text-xs transition-all"
                      onClick={handleSave}
                      disabled={!isDirty || isSavingPerms}
                      variant={isDirty ? "default" : "outline"}
                    >
                      {isSavingPerms ? (
                        "Saving..."
                      ) : !isDirty ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Saved
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs z-10 border-b border-border">
                      <tr>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 w-[240px]">
                          Module
                        </th>
                        <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5">
                          Actions / Permissions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {Object.entries(permsByModule).map(
                        ([moduleName, perms]) => {
                          const meta = MODULE_ENHANCEMENTS[moduleName] || {
                            label: moduleName,
                            desc: "",
                          };
                          const grantedInModule = perms.filter((p) =>
                            workingGrantedIds.has(p.id),
                          );
                          const hasAny =
                            grantedInModule.length > 0 ||
                            activeRole.isSystemRole;

                          return (
                            <tr
                              key={moduleName}
                              className={`hover:bg-muted/40 transition-colors ${!hasAny && !activeRole.isSystemRole ? "bg-muted/10 opacity-75" : ""}`}
                            >
                              {/* Module name */}
                              <td className="px-4 py-3 align-top border-r border-border/60 w-[240px]">
                                <div className="font-semibold text-[13px] text-foreground leading-snug">
                                  {meta.label}
                                </div>
                                {meta.desc && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                    {meta.desc}
                                  </div>
                                )}
                                {/* Access summary badge */}
                                <div className="mt-1.5">
                                  {activeRole.isSystemRole ? (
                                    <Badge variant="success" className="text-[10px] gap-1 py-0 h-5">
                                      <CheckCircle2 className="h-2.5 w-2.5" /> Full Access
                                    </Badge>
                                  ) : grantedInModule.length > 0 ? (
                                    <Badge variant="success" className="text-[10px] gap-1 py-0 h-5">
                                      <CheckCircle2 className="h-2.5 w-2.5" /> {grantedInModule.length}/{perms.length} Granted
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] gap-1 py-0 h-5 text-muted-foreground">
                                      <XCircle className="h-2.5 w-2.5" /> No Access
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* Actions toggles */}
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-wrap gap-2.5">
                                  {perms.map((perm) => {
                                    const isGranted =
                                      activeRole.isSystemRole ||
                                      workingGrantedIds.has(perm.id);

                                    return (
                                      <label
                                        key={perm.id}
                                        className={`flex items-center gap-2 text-[11px] rounded-md border px-2.5 py-1.5 cursor-pointer select-none transition-all ${
                                          isGranted
                                            ? "bg-primary/5 border-primary/30 text-primary font-medium"
                                            : "bg-card border-border text-muted-foreground"
                                        } ${activeRole.isSystemRole || !canManage ? "cursor-not-allowed opacity-75" : "hover:border-primary/50"}`}
                                      >
                                        <Switch
                                          checked={!!isGranted}
                                          onCheckedChange={() =>
                                            togglePermission(perm.id)
                                          }
                                          disabled={
                                            activeRole.isSystemRole ||
                                            !canManage
                                          }
                                          className="scale-75 origin-left"
                                        />
                                        <span className="capitalize">
                                          {perm.action.replace(/_/g, " ")}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )}
                      {Object.keys(permsByModule).length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-8 text-center text-muted-foreground text-sm"
                          >
                            No permissions available in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer note */}
                {!canManage && (
                  <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] text-amber-700">
                      You have read-only access to permissions. Contact a Super
                      Admin to make changes.
                    </span>
                  </div>
                )}
                {activeRole.isSystemRole && canManage && (
                  <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-100 flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span className="text-[11px] text-rose-700">
                      System roles have unrestricted access. Permissions cannot
                      be modified.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ListingCard>

      {/* ── Role Creation Dialog ── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. Finance Manager"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            {!editingRole && (
              <div className="space-y-2">
                <Label htmlFor="roleSlug">Role ID (Slug)</Label>
                <Input
                  id="roleSlug"
                  placeholder="e.g. FINANCE_MANAGER"
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value.toUpperCase())}
                />
                <p className="text-[10px] text-muted-foreground">
                  Unique identifier used in code. Uppercase letters and
                  underscores only.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="roleDesc">Description</Label>
              <Input
                id="roleDesc"
                placeholder="Briefly describe this role's purpose"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={!roleName || (!editingRole && !roleSlug)}
            >
              {editingRole ? "Save Changes" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
