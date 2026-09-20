import { relations } from "drizzle-orm";
import { boolean, index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { accountTypeEnum } from "./enums";
import { pk, timestamps } from "./helpers";

export const employeeBankAccounts = pgTable(
  "employee_bank_accounts",
  {
    id: pk(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    bankName: varchar("bank_name", { length: 255 }).notNull(),
    branchName: varchar("branch_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 50 }).notNull(),
    ifscCode: varchar("ifsc_code", { length: 20 }),
    accountHolderName: varchar("account_holder_name", { length: 255 }),
    accountType: accountTypeEnum("account_type").default("SAVINGS"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("employee_bank_accounts_employee_id_idx").on(t.employeeId),
    index("employee_bank_accounts_is_primary_idx").on(t.isPrimary),
  ],
);

export const employeeBankAccountsRelations = relations(employeeBankAccounts, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeBankAccounts.employeeId],
    references: [employees.id],
  }),
}));
