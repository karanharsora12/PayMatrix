import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { salaryComponents } from "./salary-components";
import {
  adjustmentTypeEnum,
  calculationTypeEnum,
  payrollApprovalStatusEnum,
  payrollEmployeeStatusEnum,
  payrollRunStatusEnum,
  payslipStatusEnum,
  salaryComponentTypeEnum,
} from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

// ---------------------------------------------------------------------------
// Payroll Runs — one per company per period
// ---------------------------------------------------------------------------
export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    payrollCode: varchar("payroll_code", { length: 40 }).notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    payDate: date("pay_date"),
    employeeCount: integer("employee_count").default(0).notNull(),
    grossAmount: numeric("gross_amount", monetary).default("0").notNull(),
    totalDeductions: numeric("total_deductions", monetary).default("0").notNull(),
    totalEmployerContributions: numeric("total_employer_contributions", monetary)
      .default("0")
      .notNull(),
    netAmount: numeric("net_amount", monetary).default("0").notNull(),
    status: payrollRunStatusEnum("status").default("DRAFT").notNull(),
    preparedBy: uuid("prepared_by"),
    approvedBy: uuid("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("payroll_runs_company_period_unique").on(t.companyId, t.periodStart, t.periodEnd),
    uniqueIndex("payroll_runs_company_code_unique").on(t.companyId, t.payrollCode),
    index("payroll_runs_company_id_idx").on(t.companyId),
    index("payroll_runs_status_idx").on(t.status),
    index("payroll_runs_period_idx").on(t.periodStart, t.periodEnd),
  ],
);

// ---------------------------------------------------------------------------
// Payroll Employees — snapshot per employee per run (immutable after FINALIZED)
// ---------------------------------------------------------------------------
export const payrollEmployees = pgTable(
  "payroll_employees",
  {
    id: pk(),
    payrollRunId: uuid("payroll_run_id")
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    workingDays: integer("working_days").notNull(),
    presentDays: numeric("present_days", ratePrecision).notNull(),
    paidLeaveDays: numeric("paid_leave_days", ratePrecision).default("0").notNull(),
    unpaidLeaveDays: numeric("unpaid_leave_days", ratePrecision).default("0").notNull(),
    absentDays: numeric("absent_days", ratePrecision).default("0").notNull(),
    overtimeMinutes: integer("overtime_minutes").default(0).notNull(),
    grossEarnings: numeric("gross_earnings", monetary).notNull(),
    totalDeductions: numeric("total_deductions", monetary).notNull(),
    employerContributions: numeric("employer_contributions", monetary).default("0").notNull(),
    netSalary: numeric("net_salary", monetary).notNull(),
    status: payrollEmployeeStatusEnum("status").default("CALCULATED").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("payroll_employees_run_employee_unique").on(t.payrollRunId, t.employeeId),
    index("payroll_employees_run_id_idx").on(t.payrollRunId),
    index("payroll_employees_employee_id_idx").on(t.employeeId),
    index("payroll_employees_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Payroll Components — snapshot of each salary component for that payroll
// ---------------------------------------------------------------------------
export const payrollComponents = pgTable(
  "payroll_components",
  {
    id: pk(),
    payrollEmployeeId: uuid("payroll_employee_id")
      .notNull()
      .references(() => payrollEmployees.id, { onDelete: "cascade" }),
    salaryComponentId: uuid("salary_component_id")
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    componentType: salaryComponentTypeEnum("component_type").notNull(),
    calculationType: calculationTypeEnum("calculation_type").notNull(),
    quantity: numeric("quantity", ratePrecision),
    rate: numeric("rate", ratePrecision),
    amount: numeric("amount", monetary).notNull(),
    isTaxable: boolean("is_taxable").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("payroll_components_payroll_employee_id_idx").on(t.payrollEmployeeId),
    index("payroll_components_component_id_idx").on(t.salaryComponentId),
    index("payroll_components_type_idx").on(t.componentType),
  ],
);

// ---------------------------------------------------------------------------
// Payroll Adjustments
// ---------------------------------------------------------------------------
export const payrollAdjustments = pgTable(
  "payroll_adjustments",
  {
    id: pk(),
    payrollEmployeeId: uuid("payroll_employee_id")
      .notNull()
      .references(() => payrollEmployees.id, { onDelete: "cascade" }),
    adjustmentType: adjustmentTypeEnum("adjustment_type").notNull(),
    description: text("description"),
    amount: numeric("amount", monetary).notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("payroll_adjustments_payroll_employee_id_idx").on(t.payrollEmployeeId),
    index("payroll_adjustments_type_idx").on(t.adjustmentType),
  ],
);

// ---------------------------------------------------------------------------
// Payslips — one per payroll_employee
// ---------------------------------------------------------------------------
export const payslips = pgTable(
  "payslips",
  {
    id: pk(),
    payrollEmployeeId: uuid("payroll_employee_id")
      .notNull()
      .references(() => payrollEmployees.id, { onDelete: "cascade" })
      .unique(),
    payslipNumber: varchar("payslip_number", { length: 40 }).notNull().unique(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
    fileUrl: text("file_url"),
    status: payslipStatusEnum("status").default("GENERATED").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("payslips_payroll_employee_id_idx").on(t.payrollEmployeeId)],
);

// ---------------------------------------------------------------------------
// Payroll Approvals — multi-level workflow
// ---------------------------------------------------------------------------
export const payrollApprovals = pgTable(
  "payroll_approvals",
  {
    id: pk(),
    payrollRunId: uuid("payroll_run_id")
      .notNull()
      .references(() => payrollRuns.id, { onDelete: "cascade" }),
    approverId: uuid("approver_id").notNull(),
    approvalLevel: integer("approval_level").default(1).notNull(),
    status: payrollApprovalStatusEnum("status").default("PENDING").notNull(),
    comments: text("comments"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("payroll_approvals_run_id_idx").on(t.payrollRunId),
    index("payroll_approvals_approver_id_idx").on(t.approverId),
    index("payroll_approvals_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  company: one(companies, { fields: [payrollRuns.companyId], references: [companies.id] }),
  employees: many(payrollEmployees),
  approvals: many(payrollApprovals),
}));

export const payrollEmployeesRelations = relations(payrollEmployees, ({ one, many }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollEmployees.payrollRunId], references: [payrollRuns.id] }),
  employee: one(employees, { fields: [payrollEmployees.employeeId], references: [employees.id] }),
  components: many(payrollComponents),
  adjustments: many(payrollAdjustments),
  payslip: one(payslips, { fields: [payrollEmployees.id], references: [payslips.payrollEmployeeId] }),
}));

export const payrollComponentsRelations = relations(payrollComponents, ({ one }) => ({
  payrollEmployee: one(payrollEmployees, {
    fields: [payrollComponents.payrollEmployeeId],
    references: [payrollEmployees.id],
  }),
  salaryComponent: one(salaryComponents, {
    fields: [payrollComponents.salaryComponentId],
    references: [salaryComponents.id],
  }),
}));

export const payrollAdjustmentsRelations = relations(payrollAdjustments, ({ one }) => ({
  payrollEmployee: one(payrollEmployees, {
    fields: [payrollAdjustments.payrollEmployeeId],
    references: [payrollEmployees.id],
  }),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  payrollEmployee: one(payrollEmployees, {
    fields: [payslips.payrollEmployeeId],
    references: [payrollEmployees.id],
  }),
}));

export const payrollApprovalsRelations = relations(payrollApprovals, ({ one }) => ({
  payrollRun: one(payrollRuns, { fields: [payrollApprovals.payrollRunId], references: [payrollRuns.id] }),
}));
