import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const documentMaster = pgTable(
  "document_master",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isRequired: boolean("is_required").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    fields: jsonb("fields").default([]).notNull(),
    templateContent: text("template_content"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("document_master_company_code_unique").on(t.companyId, t.code),
    index("document_master_company_id_idx").on(t.companyId),
  ],
);

export const documentMasterRelations = relations(documentMaster, ({ one }) => ({
  company: one(companies, {
    fields: [documentMaster.companyId],
    references: [companies.id],
  }),
}));
