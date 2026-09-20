import { relations } from "drizzle-orm";
import { boolean, date, index, numeric, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { bonusStatusEnum, bonusTypeEnum } from "./enums";
import { monetary, pk, timestamps } from "./helpers";

export const bonuses = pgTable(
  "bonuses",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    bonusType: bonusTypeEnum("bonus_type").notNull(),
    amount: numeric("amount", monetary).notNull(),
    bonusDate: date("bonus_date").notNull(),
    payrollPeriod: varchar("payroll_period", { length: 20 }), // e.g. 2026-01 or payroll_run id ref
    isTaxable: boolean("is_taxable").default(true).notNull(),
    remarks: text("remarks"),
    status: bonusStatusEnum("status").default("PENDING").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("bonuses_company_id_idx").on(t.companyId),
    index("bonuses_employee_id_idx").on(t.employeeId),
    index("bonuses_bonus_date_idx").on(t.bonusDate),
    index("bonuses_status_idx").on(t.status),
  ],
);

export const bonusesRelations = relations(bonuses, ({ one }) => ({
  company: one(companies, {
    fields: [bonuses.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [bonuses.employeeId],
    references: [employees.id],
  }),
}));
