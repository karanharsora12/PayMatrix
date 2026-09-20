import { relations } from "drizzle-orm";
import { boolean, date, index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { holidayTypeEnum } from "./enums";
import { pk, timestamps } from "./helpers";

export const holidays = pgTable(
  "holidays",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    holidayDate: date("holiday_date").notNull(),
    holidayType: holidayTypeEnum("holiday_type").default("NATIONAL").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("holidays_company_date_unique").on(t.companyId, t.holidayDate),
    index("holidays_company_id_idx").on(t.companyId),
    index("holidays_date_idx").on(t.holidayDate),
  ],
);

export const holidaysRelations = relations(holidays, ({ one }) => ({
  company: one(companies, {
    fields: [holidays.companyId],
    references: [companies.id],
  }),
}));
