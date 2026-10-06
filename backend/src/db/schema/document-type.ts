import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";
import { documentMaster } from "./document-master";

export const documentTypes = pgTable(
  "document_types",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("document_types_company_code_unique").on(t.companyId, t.code),
    index("document_types_company_id_idx").on(t.companyId),
    index("document_types_is_active_idx").on(t.isActive),
  ],
);

export const documentTypesRelations = relations(documentTypes, ({ one, many }) => ({
  company: one(companies, {
    fields: [documentTypes.companyId],
    references: [companies.id],
  }),
  documents: many(documentMaster),
}));
