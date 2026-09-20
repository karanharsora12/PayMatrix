import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const departments = pgTable(
  "departments",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    managerEmployeeId: uuid("manager_employee_id"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("departments_company_code_unique").on(t.companyId, t.code),
    index("departments_company_id_idx").on(t.companyId),
    index("departments_is_active_idx").on(t.isActive),
  ],
);

export const departmentsRelations = relations(departments, ({ one }) => ({
  company: one(companies, {
    fields: [departments.companyId],
    references: [companies.id],
  }),
}));
