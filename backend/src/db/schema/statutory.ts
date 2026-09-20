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
import { companies } from "./companies";
import { employees } from "./employees";
import { calculationTypeEnum, statutoryTypeEnum, taxDeclarationStatusEnum, taxRegimeEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const statutoryRules = pgTable(
  "statutory_rules",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    statutoryType: statutoryTypeEnum("statutory_type").notNull(),
    calculationType: calculationTypeEnum("calculation_type").default("PERCENTAGE").notNull(),
    employeePercentage: numeric("employee_percentage", ratePrecision),
    employerPercentage: numeric("employer_percentage", ratePrecision),
    minimumLimit: numeric("minimum_limit", monetary),
    maximumLimit: numeric("maximum_limit", monetary),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("statutory_rules_company_code_unique").on(t.companyId, t.code),
    index("statutory_rules_company_id_idx").on(t.companyId),
    index("statutory_rules_type_idx").on(t.statutoryType),
    index("statutory_rules_effective_idx").on(t.effectiveFrom, t.effectiveTo),
  ],
);

export const employeeStatutoryDetails = pgTable(
  "employee_statutory_details",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" })
      .unique(),
    panNumber: varchar("pan_number", { length: 20 }),
    pfNumber: varchar("pf_number", { length: 50 }),
    uanNumber: varchar("uan_number", { length: 20 }),
    esiNumber: varchar("esi_number", { length: 50 }),
    professionalTaxNumber: varchar("professional_tax_number", { length: 50 }),
    taxRegime: taxRegimeEnum("tax_regime").default("NEW").notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("employee_statutory_details_employee_id_idx").on(t.employeeId)],
);

export const employeeTaxDeclarations = pgTable(
  "employee_tax_declarations",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    financialYear: varchar("financial_year", { length: 10 }).notNull(), // e.g. 2025-26
    taxRegime: taxRegimeEnum("tax_regime").notNull(),
    declaredIncome: numeric("declared_income", monetary),
    declaredDeductions: numeric("declared_deductions", monetary),
    proofDocuments: text("proof_documents"), // JSON array of file urls or separate docs table
    status: taxDeclarationStatusEnum("status").default("DRAFT").notNull(),
    submittedAt: date("submitted_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("employee_tax_declarations_employee_year_unique").on(t.employeeId, t.financialYear),
    index("employee_tax_declarations_employee_id_idx").on(t.employeeId),
    index("employee_tax_declarations_status_idx").on(t.status),
  ],
);

export const statutoryRulesRelations = relations(statutoryRules, ({ one }) => ({
  company: one(companies, { fields: [statutoryRules.companyId], references: [companies.id] }),
}));

export const employeeStatutoryDetailsRelations = relations(employeeStatutoryDetails, ({ one }) => ({
  employee: one(employees, { fields: [employeeStatutoryDetails.employeeId], references: [employees.id] }),
}));

export const employeeTaxDeclarationsRelations = relations(employeeTaxDeclarations, ({ one }) => ({
  employee: one(employees, { fields: [employeeTaxDeclarations.employeeId], references: [employees.id] }),
}));
