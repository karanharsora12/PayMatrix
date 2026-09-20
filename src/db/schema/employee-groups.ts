import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { pk, timestamps } from "./helpers";

export const employeeGroups = pgTable(
  "employee_groups",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("employee_groups_company_code_unique").on(t.companyId, t.code),
    index("employee_groups_company_id_idx").on(t.companyId),
  ],
);

export const employeeGroupMembers = pgTable(
  "employee_group_members",
  {
    id: pk(),
    employeeGroupId: uuid("employee_group_id")
      .notNull()
      .references(() => employeeGroups.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    uniqueIndex("employee_group_members_group_employee_unique").on(t.employeeGroupId, t.employeeId),
    index("employee_group_members_employee_id_idx").on(t.employeeId),
  ],
);

export const employeeGroupsRelations = relations(employeeGroups, ({ one, many }) => ({
  company: one(companies, {
    fields: [employeeGroups.companyId],
    references: [companies.id],
  }),
  members: many(employeeGroupMembers),
}));

export const employeeGroupMembersRelations = relations(employeeGroupMembers, ({ one }) => ({
  group: one(employeeGroups, {
    fields: [employeeGroupMembers.employeeGroupId],
    references: [employeeGroups.id],
  }),
  employee: one(employees, {
    fields: [employeeGroupMembers.employeeId],
    references: [employees.id],
  }),
}));
