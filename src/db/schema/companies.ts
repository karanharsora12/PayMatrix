import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { pk, timestamps } from "./helpers";

export const companies = pgTable(
  "companies",
  {
    id: pk(),
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    legalName: varchar("legal_name", { length: 255 }),
    logoUrl: text("logo_url"),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    website: varchar("website", { length: 255 }),
    taxNumber: varchar("tax_number", { length: 100 }),
    registrationNumber: varchar("registration_number", { length: 100 }),
    address: text("address"),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    country: varchar("country", { length: 120 }).default("India"),
    postalCode: varchar("postal_code", { length: 20 }),
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    timezone: varchar("timezone", { length: 60 }).default("Asia/Kolkata").notNull(),
    dateFormat: varchar("date_format", { length: 20 }).default("DD/MM/YYYY"),
    financialYearStart: date("financial_year_start"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("companies_code_unique").on(t.code),
    index("companies_is_active_idx").on(t.isActive),
    // check constraints via raw SQL helper using extraConfig? Drizzle supports check()
    // We add explicit checks in migration SQL if needed; keep portable here.
  ],
);

export const companyRelations = relations(companies, ({ many }) => ({
  // defined in respective files to avoid circular import issues;
  // keep placeholder for type augmentation
  branches: many(companies as never), // will be overridden by branches relations
}));
