import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { employees } from "./employees";
import { users } from "./users";
import { pk, timestamps } from "./helpers";

export const userParameters = pgTable(
  "user_parameters",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "cascade",
    }),
    parameterName: varchar("parameter_name", { length: 120 }).notNull(),
    parameterValue: varchar("parameter_value", { length: 255 }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("user_parameters_company_emp_param_unique").on(
      t.companyId,
      t.employeeId,
      t.parameterName,
    ),
    uniqueIndex("user_parameters_company_user_param_unique").on(
      t.companyId,
      t.userId,
      t.parameterName,
    ),
    index("user_parameters_company_id_idx").on(t.companyId),
    index("user_parameters_employee_id_idx").on(t.employeeId),
    index("user_parameters_user_id_idx").on(t.userId),
    index("user_parameters_name_idx").on(t.parameterName),
  ],
);

export const userParametersRelations = relations(userParameters, ({ one }) => ({
  company: one(companies, {
    fields: [userParameters.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [userParameters.employeeId],
    references: [employees.id],
  }),
  user: one(users, {
    fields: [userParameters.userId],
    references: [users.id],
  }),
}));
