import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const companySettings = pgTable(
  "company_settings",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }).notNull(),
    value: text("value"), // store JSON stringified; alternatively jsonb column
    valueType: varchar("value_type", { length: 20 }).default("STRING").notNull(), // STRING | NUMBER | BOOLEAN | JSON
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("company_settings_company_key_unique").on(t.companyId, t.key),
    index("company_settings_company_id_idx").on(t.companyId),
  ],
);

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  company: one(companies, { fields: [companySettings.companyId], references: [companies.id] }),
}));
