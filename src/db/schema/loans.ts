import { relations } from "drizzle-orm";
import { boolean, date, index, integer, numeric, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { loanInstallmentStatusEnum, loanStatusEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const loanTypes = pgTable(
  "loan_types",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    maximumAmount: numeric("maximum_amount", monetary),
    interestRate: numeric("interest_rate", ratePrecision),
    maximumTenure: integer("maximum_tenure"), // months
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("loan_types_company_code_unique").on(t.companyId, t.code),
    index("loan_types_company_id_idx").on(t.companyId),
  ],
);

export const employeeLoans = pgTable(
  "employee_loans",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    loanTypeId: uuid("loan_type_id")
      .notNull()
      .references(() => loanTypes.id, { onDelete: "restrict" }),
    principalAmount: numeric("principal_amount", monetary).notNull(),
    interestRate: numeric("interest_rate", ratePrecision),
    tenureMonths: integer("tenure_months").notNull(),
    emiAmount: numeric("emi_amount", monetary).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    totalAmount: numeric("total_amount", monetary),
    paidAmount: numeric("paid_amount", monetary).default("0").notNull(),
    outstandingAmount: numeric("outstanding_amount", monetary).notNull(),
    status: loanStatusEnum("status").default("PENDING").notNull(),
    remarks: text("remarks"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_loans_company_id_idx").on(t.companyId),
    index("employee_loans_employee_id_idx").on(t.employeeId),
    index("employee_loans_loan_type_id_idx").on(t.loanTypeId),
    index("employee_loans_status_idx").on(t.status),
  ],
);

export const loanInstallments = pgTable(
  "loan_installments",
  {
    id: pk(),
    employeeLoanId: uuid("employee_loan_id")
      .notNull()
      .references(() => employeeLoans.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: date("due_date").notNull(),
    principalAmount: numeric("principal_amount", monetary).notNull(),
    interestAmount: numeric("interest_amount", monetary).default("0").notNull(),
    totalAmount: numeric("total_amount", monetary).notNull(),
    paidAmount: numeric("paid_amount", monetary).default("0").notNull(),
    outstandingAmount: numeric("outstanding_amount", monetary).notNull(),
    status: loanInstallmentStatusEnum("status").default("PENDING").notNull(),
    paidAt: date("paid_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("loan_installments_loan_number_unique").on(t.employeeLoanId, t.installmentNumber),
    index("loan_installments_loan_id_idx").on(t.employeeLoanId),
    index("loan_installments_due_date_idx").on(t.dueDate),
    index("loan_installments_status_idx").on(t.status),
  ],
);

export const loanTypesRelations = relations(loanTypes, ({ one, many }) => ({
  company: one(companies, { fields: [loanTypes.companyId], references: [companies.id] }),
  loans: many(employeeLoans),
}));

export const employeeLoansRelations = relations(employeeLoans, ({ one, many }) => ({
  company: one(companies, { fields: [employeeLoans.companyId], references: [companies.id] }),
  employee: one(employees, { fields: [employeeLoans.employeeId], references: [employees.id] }),
  loanType: one(loanTypes, { fields: [employeeLoans.loanTypeId], references: [loanTypes.id] }),
  installments: many(loanInstallments),
}));

export const loanInstallmentsRelations = relations(loanInstallments, ({ one }) => ({
  loan: one(employeeLoans, { fields: [loanInstallments.employeeLoanId], references: [employeeLoans.id] }),
}));
