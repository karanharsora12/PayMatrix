import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { addressTypeEnum } from "./enums";
import { pk, timestamps } from "./helpers";

export const employeeAddresses = pgTable(
  "employee_addresses",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    addressType: addressTypeEnum("address_type").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: varchar("city", { length: 120 }),
    state: varchar("state", { length: 120 }),
    country: varchar("country", { length: 120 }).default("India"),
    postalCode: varchar("postal_code", { length: 20 }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_addresses_employee_id_idx").on(t.employeeId),
    index("employee_addresses_type_idx").on(t.addressType),
  ],
);

export const employeeAddressesRelations = relations(employeeAddresses, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeAddresses.employeeId],
    references: [employees.id],
  }),
}));
