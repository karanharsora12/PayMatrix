import { relations } from "drizzle-orm";
import { date, index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { advanceStatusEnum } from "./enums";
import { monetary, pk, timestamps } from "./helpers";

export const employeeAdvances = pgTable(
  "employee_advances",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    amount: numeric("amount", monetary).notNull(),
    advanceDate: date("advance_date").notNull(),
    recoveryStartDate: date("recovery_start_date"),
    recoveryEndDate: date("recovery_end_date"),
    recoveryAmount: numeric("recovery_amount", monetary),
    remarks: text("remarks"),
    status: advanceStatusEnum("status").default("PENDING").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_advances_company_id_idx").on(t.companyId),
    index("employee_advances_employee_id_idx").on(t.employeeId),
    index("employee_advances_status_idx").on(t.status),
    index("employee_advances_date_idx").on(t.advanceDate),
  ],
);

export const employeeAdvancesRelations = relations(employeeAdvances, ({ one }) => ({
  company: one(companies, { fields: [employeeAdvances.companyId], references: [companies.id] }),
  employee: one(employees, { fields: [employeeAdvances.employeeId], references: [employees.id] }),
}));
