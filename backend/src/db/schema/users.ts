import { relations } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { pk, timestamps } from "./helpers";

export const users = pgTable(
  "users",
  {
    id: pk(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    index("users_company_id_idx").on(t.companyId),
    index("users_employee_id_idx").on(t.employeeId),
    index("users_is_active_idx").on(t.isActive),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  employee: one(employees, { fields: [users.employeeId], references: [employees.id] }),
}));
