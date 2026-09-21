import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { calculationTypeEnum, salaryComponentTypeEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const salaryComponents = pgTable(
  "salary_components",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    componentType: salaryComponentTypeEnum("component_type").notNull(),
    calculationType: calculationTypeEnum("calculation_type").default("FIXED").notNull(),
    defaultAmount: numeric("default_amount", monetary),
    defaultPercentage: numeric("default_percentage", ratePrecision),
    calculationBasis: varchar("calculation_basis", { length: 40 }), // e.g. BASIC, GROSS, CTC
    formula: text("formula"), // e.g. "BASIC * 0.4"
    isTaxable: boolean("is_taxable").default(true).notNull(),
    isStatutory: boolean("is_statutory").default(false).notNull(),
    isProratable: boolean("is_proratable").default(true).notNull(),
    isRecurring: boolean("is_recurring").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("salary_components_company_code_unique").on(t.companyId, t.code),
    index("salary_components_company_id_idx").on(t.companyId),
    index("salary_components_type_idx").on(t.componentType),
    index("salary_components_is_active_idx").on(t.isActive),
  ],
);

export const salaryComponentsRelations = relations(salaryComponents, ({ one }) => ({
  company: one(companies, {
    fields: [salaryComponents.companyId],
    references: [companies.id],
  }),
}));
