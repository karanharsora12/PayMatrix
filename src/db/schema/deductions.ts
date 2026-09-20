import { relations } from "drizzle-orm";
import { boolean, date, index, numeric, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { salaryComponents } from "./salary-components";
import { deductionStatusEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const employeeDeductions = pgTable(
  "employee_deductions",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    salaryComponentId: uuid("salary_component_id")
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    amount: numeric("amount", monetary),
    percentage: numeric("percentage", ratePrecision),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    isRecurring: boolean("is_recurring").default(true).notNull(),
    remarks: text("remarks"),
    status: deductionStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_deductions_company_id_idx").on(t.companyId),
    index("employee_deductions_employee_id_idx").on(t.employeeId),
    index("employee_deductions_component_id_idx").on(t.salaryComponentId),
    index("employee_deductions_status_idx").on(t.status),
  ],
);

export const employeeDeductionsRelations = relations(employeeDeductions, ({ one }) => ({
  company: one(companies, {
    fields: [employeeDeductions.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [employeeDeductions.employeeId],
    references: [employees.id],
  }),
  salaryComponent: one(salaryComponents, {
    fields: [employeeDeductions.salaryComponentId],
    references: [salaryComponents.id],
  }),
}));
