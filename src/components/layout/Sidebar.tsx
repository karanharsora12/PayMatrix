import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  Clock,
  Wallet,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  Building,
  Layers,
  MapPin,
  UserCog,
  File,
  Landmark,
  Timer,
  CalendarRange,
  Palmtree,
  FileText,
  Coins,
  Layers2,
  UserCheck,
  Receipt,
  Gift,
  MinusCircle,
  Banknote,
  Scale,
  ClipboardList,
  UsersRound,
  History,
  SlidersHorizontal,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  {
    group: "Organization",
    items: [
      {
        label: "Company",
        icon: Building,
        path: "/organization/company",
        perm: "settings.view",
      },
      {
        label: "Branches",
        icon: Building2,
        path: "/branches",
        perm: "branches.view",
      },
      {
        label: "Departments",
        icon: Layers,
        path: "/departments",
        perm: "departments.view",
      },
      {
        label: "Designations",
        icon: Layers2,
        path: "/designations",
        perm: "designations.view",
      },
      {
        label: "Locations",
        icon: MapPin,
        path: "/locations",
        perm: "settings.view",
      },
    ],
  },
  {
    group: "Employees",
    items: [
      {
        label: "Employees",
        icon: Users,
        path: "/employees",
        perm: "employees.view",
      },
      {
        label: "Employee Groups",
        icon: UsersRound,
        path: "/employee-groups",
        perm: "employees.view",
      },
      {
        label: "Documents",
        icon: File,
        path: "/documents",
        perm: "documents.view",
      },
    ],
  },
  {
    group: "Attendance",
    items: [
      {
        label: "My Attendance",
        icon: Clock,
        path: "/my-attendance",
        perm: "attendance.view",
      },
      {
        label: "Attendance Register",
        icon: ClipboardList,
        path: "/attendance-register",
        perm: "attendance.manage",
      },
      {
        label: "Shifts",
        icon: Timer,
        path: "/shifts",
        perm: "attendance.manage",
      },
      {
        label: "Holidays",
        icon: CalendarRange,
        path: "/holidays",
        perm: "attendance.view",
      },
    ],
  },
  {
    group: "Leave",
    items: [
      {
        label: "Leave Management",
        icon: Palmtree,
        path: "/leave",
        perm: "leave.view",
      },
    ],
  },
  {
    group: "Payroll",
    items: [
      {
        label: "Salary Components",
        icon: Coins,
        path: "/salary-components",
        perm: "salary.view",
      },
      {
        label: "Salary Structures",
        icon: SlidersHorizontal,
        path: "/salary-structures",
        perm: "salary.view",
      },
      {
        label: "Employee Salary",
        icon: UserCheck,
        path: "/employee-salary",
        perm: "salary.view",
      },
      {
        label: "Payslips",
        icon: Receipt,
        path: "/payslips",
        perm: "payroll.view",
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        label: "Roles & Permissions",
        icon: ShieldCheck,
        path: "/roles",
        perm: "roles.view",
      },
      {
        label: "User Parameters",
        icon: SlidersHorizontal,
        path: "/user-parameters",
        perm: "roles.view",
      },
      {
        label: "Email Templates",
        icon: Mail,
        path: "/email-templates",
        perm: "settings.view",
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  setMobileOpen,
}: {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const { hasPermission, user } = useAuth();
  const canManageAttendanceParam = useSelector(
    (state: RootState) => state.userParameters.CanManageAttendance,
  );
  const loc = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Organization: true,
    Employees: true,
    Payroll: true,
  });
  const toggle = (g: string) => setOpenGroups((s) => ({ ...s, [g]: !s[g] }));

  const checkItemPerm = (item: any) => {
    if (!item.perm) return true;
    if (item.path === "/attendance-register" || item.path === "/shifts") {
      if (canManageAttendanceParam) return true;
      if (user?.roles?.includes("SUPER_ADMIN")) return true;
      return hasPermission("attendance.manage") || hasPermission("attendance.edit");
    }
    return hasPermission(item.perm);
  };

  const filteredNav = nav
    .map((g) => {
      if (g.items) {
        return {
          ...g,
          items: g.items.filter(checkItemPerm),
        };
      }
      return g;
    })
    .filter((g) => !g.items || g.items.length > 0);
  const content = (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-colors",
        collapsed ? "w-[64px]" : "w-[260px]",
      )}
    >
      <div className="h-[56px] flex items-center gap-3 px-4 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
          PM
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-semibold leading-none text-sidebar-foreground">PayMatrix</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Payroll & HRMS
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {filteredNav.map((item: any) => {
          if (item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/75 hover:text-sidebar-foreground",
                    collapsed && "justify-center",
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            );
          const isOpen = openGroups[item.group] ?? false;
          return (
            <div key={item.group}>
              {!collapsed ? (
                <button
                  onClick={() => toggle(item.group)}
                  className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/80 hover:text-sidebar-foreground transition-colors"
                >
                  {item.group}{" "}
                  <ChevronDown
                    className={cn("h-3 w-3 transition", isOpen && "rotate-180")}
                  />
                </button>
              ) : (
                <div className="h-px bg-sidebar-border my-2" />
              )}
              {(isOpen || collapsed) && (
                <div className="space-y-0.5">
                  {item.items.map((it: any) => (
                    <NavLink
                      key={it.path}
                      to={it.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                            : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground",
                          collapsed && "justify-center",
                        )
                      }
                    >
                      <it.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && it.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <>
      <div
        className={cn(
          "hidden lg:flex shrink-0 transition-all",
          collapsed ? "w-[64px]" : "w-[260px]",
        )}
      >
        {content}
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="w-[280px] bg-sidebar text-sidebar-foreground h-full overflow-auto shadow-xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
