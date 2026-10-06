import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { documentTypes } from "./document-type";
import { pk, timestamps } from "./helpers";

export const documentMaster = pgTable(
  "document_master",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    documentTypeId: uuid("document_type_id")
      .references(() => documentTypes.id, { onDelete: "set null" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isRequired: boolean("is_required").default(false).notNull(),
    isRepeatable: boolean("is_repeatable").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    // Structured fields: [{ label, variable, type, required, description, order }]
    fields: jsonb("fields").default([]).notNull(),
    templateContent: text("template_content"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("document_master_company_code_unique").on(t.companyId, t.code),
    index("document_master_company_id_idx").on(t.companyId),
    index("document_master_type_idx").on(t.documentTypeId),
    index("document_master_is_active_idx").on(t.isActive),
  ],
);

export const documentMasterRelations = relations(documentMaster, ({ one }) => ({
  company: one(companies, {
    fields: [documentMaster.companyId],
    references: [companies.id],
  }),
  documentType: one(documentTypes, {
    fields: [documentMaster.documentTypeId],
    references: [documentTypes.id],
  }),
}));
