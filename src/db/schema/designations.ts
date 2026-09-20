import { relations } from "drizzle-orm";
import {
  boolean,
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
import { departments } from "./departments";
import { monetary, pk, timestamps } from "./helpers";

export const designations = pgTable(
  "designations",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    grade: varchar("grade", { length: 20 }),
    level: integer("level"),
    minimumSalary: numeric("minimum_salary", monetary),
    maximumSalary: numeric("maximum_salary", monetary),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("designations_company_code_unique").on(t.companyId, t.code),
    index("designations_company_id_idx").on(t.companyId),
    index("designations_department_id_idx").on(t.departmentId),
  ],
);

export const designationsRelations = relations(designations, ({ one }) => ({
  company: one(companies, {
    fields: [designations.companyId],
    references: [companies.id],
  }),
  department: one(departments, {
    fields: [designations.departmentId],
    references: [departments.id],
  }),
}));
