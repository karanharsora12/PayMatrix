/**
 * PayMatrix — Drizzle Schema Barrel
 *
 * Import order matters: tables with no FK dependencies first.
 * Re-export everything so `drizzle-kit` and app code can do:
 *   import * as schema from "@/db/schema";
 */

export * from "./enums";
export * from "./helpers";

// Core org
export * from "./companies";
export * from "./branches";
export * from "./departments";
export * from "./designations";
export * from "./employment-types";

// Employee domain
export * from "./employees";
export * from "./employee-addresses";
export * from "./employee-bank-accounts";
export * from "./employee-documents";
export * from "./employee-groups";

// Attendance
export * from "./shifts";
export * from "./holidays";
export * from "./attendance";

// Leave
export * from "./leave";

// Salary
export * from "./salary-components";
export * from "./salary-structures";
export * from "./employee-salaries";

// Compensation extras
export * from "./bonuses";
export * from "./deductions";
export * from "./loans";
export * from "./advances";

// Payroll
export * from "./payroll";

// Statutory / Tax
export * from "./statutory";

// Auth / RBAC
export * from "./permissions";
export * from "./roles";
export * from "./users";

// Cross-cutting
export * from "./audit-logs";
export * from "./notifications";
export * from "./settings";
