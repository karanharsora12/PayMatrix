import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { pk, timestamps } from "./helpers";

export const locations = pgTable(
  "locations",
  {
    id: pk(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    country: varchar("country", { length: 120 }),
    postalCode: varchar("postal_code", { length: 20 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("locations_company_code_unique").on(t.companyId, t.code),
    index("locations_company_id_idx").on(t.companyId),
  ],
);

export const locationsRelations = relations(locations, ({ one }) => ({
  company: one(companies, { fields: [locations.companyId], references: [companies.id] }),
}));
