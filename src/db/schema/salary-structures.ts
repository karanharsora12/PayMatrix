import { relations } from "drizzle-orm";
import {
  boolean,
  date,
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
import { salaryComponents } from "./salary-components";
import { calculationTypeEnum } from "./enums";
import { monetary, pk, ratePrecision, timestamps } from "./helpers";

export const salaryStructures = pgTable(
  "salary_structures",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("salary_structures_company_code_unique").on(t.companyId, t.code),
    index("salary_structures_company_id_idx").on(t.companyId),
    index("salary_structures_effective_idx").on(t.effectiveFrom, t.effectiveTo),
  ],
);

export const salaryStructureComponents = pgTable(
  "salary_structure_components",
  {
    id: pk(),
    salaryStructureId: uuid("salary_structure_id")
      .notNull()
      .references(() => salaryStructures.id, { onDelete: "cascade" }),
    salaryComponentId: uuid("salary_component_id")
      .notNull()
      .references(() => salaryComponents.id, { onDelete: "restrict" }),
    calculationType: calculationTypeEnum("calculation_type").notNull(),
    amount: numeric("amount", monetary),
    percentage: numeric("percentage", ratePrecision),
    formula: text("formula"),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("salary_structure_components_structure_component_unique").on(
      t.salaryStructureId,
      t.salaryComponentId,
    ),
    index("salary_structure_components_structure_id_idx").on(t.salaryStructureId),
    index("salary_structure_components_component_id_idx").on(t.salaryComponentId),
  ],
);

export const salaryStructuresRelations = relations(salaryStructures, ({ one, many }) => ({
  company: one(companies, {
    fields: [salaryStructures.companyId],
    references: [companies.id],
  }),
  components: many(salaryStructureComponents),
}));

export const salaryStructureComponentsRelations = relations(salaryStructureComponents, ({ one }) => ({
  salaryStructure: one(salaryStructures, {
    fields: [salaryStructureComponents.salaryStructureId],
    references: [salaryStructures.id],
  }),
  salaryComponent: one(salaryComponents, {
    fields: [salaryStructureComponents.salaryComponentId],
    references: [salaryComponents.id],
  }),
}));
