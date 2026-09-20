import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const employmentTypes = pgTable(
  "employment_types",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("employment_types_company_code_unique").on(t.companyId, t.code),
    index("employment_types_company_id_idx").on(t.companyId),
  ],
);

export const employmentTypesRelations = relations(employmentTypes, ({ one }) => ({
  company: one(companies, {
    fields: [employmentTypes.companyId],
    references: [companies.id],
  }),
}));
