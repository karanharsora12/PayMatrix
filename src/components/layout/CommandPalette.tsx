import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Building2,
  Building,
  Layers,
  Layers2,
  MapPin,
  Users,
  UsersRound,
  File,
  ClipboardList,
  Timer,
  CalendarRange,
  Palmtree,
  Coins,
  SlidersHorizontal,
  UserCheck,
  Receipt,
  ShieldCheck,
  BarChart3,
  Mail,
  Search,
  type LucideIcon,
} from "lucide-react";

// ─── Route Registry ────────────────────────────────────────────────────────────
// Derived directly from Sidebar nav config + App.tsx routes
interface SearchItem {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  group: string;
  perm?: string; // undefined = always visible (no permission gate)
  aliases?: string[]; // extra search keywords
}

const SEARCH_INDEX: SearchItem[] = [
  // No permission
  {
    label: "Dashboard",
    description: "Overview and key metrics",
    path: "/",
    icon: LayoutDashboard,
    group: "General",
    aliases: ["home", "overview", "main"],
  },

  // Organization
  {
    label: "Company",
    description: "Manage company information and settings",
    path: "/organization/company",
    icon: Building,
    group: "Organization",
    perm: "settings.view",
    aliases: ["org", "organization", "firm"],
  },
  {
    label: "Branches",
    description: "Manage company branches and offices",
    path: "/branches",
    icon: Building2,
    group: "Organization",
    perm: "branches.view",
    aliases: ["office", "location", "site"],
  },
  {
    label: "Departments",
    description: "Manage departments within the organization",
    path: "/departments",
    icon: Layers,
    group: "Organization",
    perm: "departments.view",
    aliases: ["dept", "division", "team"],
  },
  {
    label: "Designations",
    description: "Manage employee designations and roles",
    path: "/designations",
    icon: Layers2,
    group: "Organization",
    perm: "designations.view",
    aliases: ["title", "position", "role"],
  },
  {
    label: "Locations",
    description: "Manage geographic locations",
    path: "/locations",
    icon: MapPin,
    group: "Organization",
    perm: "settings.view",
    aliases: ["city", "region", "area"],
  },

  // Employees
  {
    label: "Employees",
    description: "View and manage all employees",
    path: "/employees",
    icon: Users,
    group: "Employees",
    perm: "employees.view",
    aliases: ["staff", "worker", "people", "member"],
  },
  {
    label: "Employee Groups",
    description: "Manage employee groupings and assignments",
    path: "/employee-groups",
    icon: UsersRound,
    group: "Employees",
    perm: "employees.view",
    aliases: ["groups", "teams", "cohort"],
  },
  {
    label: "Documents",
    description: "Document master and assignment management",
    path: "/documents",
    icon: File,
    group: "Employees",
    perm: "documents.view",
    aliases: [
      "docs",
      "document master",
      "letters",
      "offer letter",
      "joining",
      "confirmation",
    ],
  },

  // Attendance
  {
    label: "Attendance",
    description: "Track and manage employee attendance",
    path: "/attendance-register",
    icon: ClipboardList,
    group: "Attendance",
    perm: "attendance.view",
    aliases: ["register", "clock", "checkin", "check in", "present"],
  },
  {
    label: "Shifts",
    description: "Configure and manage work shifts",
    path: "/shifts",
    icon: Timer,
    group: "Attendance",
    perm: "attendance.view",
    aliases: ["timing", "schedule", "hours"],
  },
  {
    label: "Holidays",
    description: "Manage public and company holidays",
    path: "/holidays",
    icon: CalendarRange,
    group: "Attendance",
    perm: "attendance.view",
    aliases: ["calendar", "festival", "public holiday", "national"],
  },

  // Leave
  {
    label: "Leave Management",
    description: "Manage employee leave requests and balances",
    path: "/leave",
    icon: Palmtree,
    group: "Leave",
    perm: "leave.view",
    aliases: ["time off", "pto", "vacation", "sick", "leave request"],
  },

  // Payroll
  {
    label: "Salary Components",
    description: "Configure earnings and deduction components",
    path: "/salary-components",
    icon: Coins,
    group: "Payroll",
    perm: "salary.view",
    aliases: ["hra", "basic", "pf", "deductions", "earnings"],
  },
  {
    label: "Salary Structures",
    description: "Define and manage salary structure templates",
    path: "/salary-structures",
    icon: SlidersHorizontal,
    group: "Payroll",
    perm: "salary.view",
    aliases: ["ctc", "package", "structure", "template"],
  },
  {
    label: "Employee Salary",
    description: "Assign and review individual employee salaries",
    path: "/employee-salary",
    icon: UserCheck,
    group: "Payroll",
    perm: "salary.view",
    aliases: ["assign salary", "employee pay", "compensation"],
  },
  {
    label: "Payslips",
    description: "Generate and view employee payslips",
    path: "/payslips",
    icon: Receipt,
    group: "Payroll",
    perm: "payroll.view",
    aliases: ["pay slip", "salary slip", "payroll", "pay", "monthly pay"],
  },

  // Reports
  {
    label: "Reports",
    description: "View payroll, attendance, and employee reports",
    path: "/reports",
    icon: BarChart3,
    group: "Reports",
    aliases: ["analytics", "summary", "export", "data"],
  },

  // Administration
  {
    label: "Roles & Permissions",
    description: "Manage user roles and access control",
    path: "/roles",
    icon: ShieldCheck,
    group: "Administration",
    perm: "roles.view",
    aliases: ["users", "access", "acl", "admin", "permissions"],
  },
  {
    label: "User Parameters",
    description: "Configure global system parameters",
    path: "/user-parameters",
    icon: SlidersHorizontal,
    group: "Administration",
    perm: "roles.view",
    aliases: ["params", "configuration", "config", "settings"],
  },
  {
    label: "Email Templates",
    description: "Manage HR email notification templates",
    path: "/email-templates",
    icon: Mail,
    group: "Administration",
    perm: "settings.view",
    aliases: ["email", "notification", "mail", "template"],
  },
];

// ─── Helper ─────────────────────────────────────────────────────────────────
function matches(item: SearchItem, q: string): boolean {
  const lower = q.toLowerCase();
  if (item.label.toLowerCase().includes(lower)) return true;
  if (item.description.toLowerCase().includes(lower)) return true;
  if (item.aliases?.some((a) => a.toLowerCase().includes(lower))) return true;
  if (item.group.toLowerCase().includes(lower)) return true;
  return false;
}

// ─── CommandPalette ──────────────────────────────────────────────────────────
interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { hasPermission } = useAuth();
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // Filter by query + permission
  const results = useMemo(() => {
    const allowed = SEARCH_INDEX.filter((item) =>
      item.perm ? hasPermission(item.perm) : true,
    );
    if (!q.trim()) return allowed;
    return allowed.filter((item) => matches(item, q));
  }, [q, hasPermission]);

  // Group results
  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    results.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return map;
  }, [results]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keep activeIdx in bounds
  useEffect(() => {
    setActiveIdx(0);
  }, [q]);

  const goTo = (path: string) => {
    nav(path);
    onOpenChange(false);
    setQ("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (results[activeIdx]) goTo(results[activeIdx].path);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  // Flat list for index tracking
  let flatIdx = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search PayMatrix..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground text-foreground"
          />
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No results for{" "}
                <span className="font-medium text-foreground">"{q}"</span>
              </p>
              <p className="text-xs text-muted-foreground/70">
                Try searching for employees, payslips, or attendance
              </p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = flatIdx++;
                  const isActive = idx === activeIdx;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => goTo(item.path)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium leading-tight ${isActive ? "text-primary" : ""}`}
                        >
                          {item.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
