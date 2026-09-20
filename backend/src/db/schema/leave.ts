import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { leaveStatusEnum } from "./enums";
import { pk, ratePrecision, timestamps } from "./helpers";

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isPaid: boolean("is_paid").default(true).notNull(),
    annualAllowance: numeric("annual_allowance", ratePrecision).default("0").notNull(),
    carryForwardAllowed: boolean("carry_forward_allowed").default(false).notNull(),
    maxCarryForwardDays: numeric("max_carry_forward_days", ratePrecision),
    maxConsecutiveDays: integer("max_consecutive_days"),
    requiresApproval: boolean("requires_approval").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("leave_types_company_code_unique").on(t.companyId, t.code),
    index("leave_types_company_id_idx").on(t.companyId),
  ],
);

export const employeeLeaveBalances = pgTable(
  "employee_leave_balances",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    openingBalance: numeric("opening_balance", ratePrecision).default("0").notNull(),
    allocatedDays: numeric("allocated_days", ratePrecision).default("0").notNull(),
    usedDays: numeric("used_days", ratePrecision).default("0").notNull(),
    pendingDays: numeric("pending_days", ratePrecision).default("0").notNull(),
    remainingDays: numeric("remaining_days", ratePrecision).default("0").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("employee_leave_balances_emp_type_year_unique").on(t.employeeId, t.leaveTypeId, t.year),
    index("employee_leave_balances_employee_id_idx").on(t.employeeId),
    index("employee_leave_balances_leave_type_id_idx").on(t.leaveTypeId),
    index("employee_leave_balances_year_idx").on(t.year),
  ],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "restrict" }),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    totalDays: numeric("total_days", ratePrecision).notNull(),
    reason: text("reason"),
    status: leaveStatusEnum("status").default("PENDING").notNull(),
    approvedBy: uuid("approved_by"),
    approvedAt: date("approved_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("leave_requests_company_id_idx").on(t.companyId),
    index("leave_requests_employee_id_idx").on(t.employeeId),
    index("leave_requests_leave_type_id_idx").on(t.leaveTypeId),
    index("leave_requests_status_idx").on(t.status),
    index("leave_requests_dates_idx").on(t.fromDate, t.toDate),
  ],
);

// Relations
export const leaveTypesRelations = relations(leaveTypes, ({ one, many }) => ({
  company: one(companies, {
    fields: [leaveTypes.companyId],
    references: [companies.id],
  }),
  balances: many(employeeLeaveBalances),
  requests: many(leaveRequests),
}));

export const employeeLeaveBalancesRelations = relations(employeeLeaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeLeaveBalances.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [employeeLeaveBalances.leaveTypeId],
    references: [leaveTypes.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  company: one(companies, {
    fields: [leaveRequests.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
}));
