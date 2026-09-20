import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const branches = pgTable(
  "branches",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    // manager is an employee; FK added via additional constraint after employees table exists.
    // We keep uuid column here; foreign key is added in employees.ts via sql or by referencing after.
    managerEmployeeId: uuid("manager_employee_id"),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    address: text("address"),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    country: varchar("country", { length: 120 }).default("India"),
    postalCode: varchar("postal_code", { length: 20 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("branches_company_code_unique").on(t.companyId, t.code),
    index("branches_company_id_idx").on(t.companyId),
    index("branches_is_active_idx").on(t.isActive),
  ],
);

export const branchesRelations = relations(branches, ({ one }) => ({
  company: one(companies, {
    fields: [branches.companyId],
    references: [companies.id],
  }),
}));
