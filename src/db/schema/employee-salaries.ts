import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { salaryComponents } from "./salary-components";
import { salaryStructures } from "./salary-structures";
import { calculationTypeEnum, salaryStructureStatusEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const employeeSalaryStructures = pgTable(
  "employee_salary_structures",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructures.id, { onDelete: "restrict" }),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    basicSalary: numeric("basic_salary", monetary),
    grossSalary: numeric("gross_salary", monetary),
    annualCtc: numeric("annual_ctc", monetary),
    status: salaryStructureStatusEnum("status").default("ACTIVE").notNull(),
    remarks: text("remarks"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_salary_structures_employee_id_idx").on(t.employeeId),
    index("employee_salary_structures_structure_id_idx").on(t.salaryStructureId),
    index("employee_salary_structures_effective_idx").on(t.effectiveFrom, t.effectiveTo),
    // prevent overlapping active assignments at app level; partial unique via exclusion would need extension.
    // Add check: effective_to >= effective_from handled in app/migration
  ],
);

export const employeeSalaryComponents = pgTable(
  "employee_salary_components",
  {
    id: pk(),
    employeeSalaryStructureId: uuid("employee_salary_structure_id")
      .notNull()
      .references(() => employeeSalaryStructures.id, { onDelete: "cascade" }),
    salaryComponentId: uuid("salary_component_id")
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    calculationType: calculationTypeEnum("calculation_type").notNull(),
    amount: numeric("amount", monetary),
    percentage: numeric("percentage", ratePrecision),
    formula: text("formula"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("employee_salary_components_structure_component_unique").on(
      t.employeeSalaryStructureId,
      t.salaryComponentId,
    ),
    index("employee_salary_components_component_id_idx").on(t.salaryComponentId),
  ],
);

export const employeeSalaryStructuresRelations = relations(employeeSalaryStructures, ({ one, many }) => ({
  employee: one(employees, {
    fields: [employeeSalaryStructures.employeeId],
    references: [employees.id],
  }),
  salaryStructure: one(salaryStructures, {
    fields: [employeeSalaryStructures.salaryStructureId],
    references: [salaryStructures.id],
  }),
  components: many(employeeSalaryComponents),
}));

export const employeeSalaryComponentsRelations = relations(employeeSalaryComponents, ({ one }) => ({
  employeeSalaryStructure: one(employeeSalaryStructures, {
    fields: [employeeSalaryComponents.employeeSalaryStructureId],
    references: [employeeSalaryStructures.id],
  }),
  salaryComponent: one(salaryComponents, {
    fields: [employeeSalaryComponents.salaryComponentId],
    references: [salaryComponents.id],
  }),
}));
