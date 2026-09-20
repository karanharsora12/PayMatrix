import { relations } from "drizzle-orm";
import { index, pgTable, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { permissionActionEnum } from "./enums";
import { pk } from "./helpers";

export const permissions = pgTable(
  "permissions",
  {
    id: pk(),
    module: varchar("module", { length: 80 }).notNull(), // e.g. employees, payroll, leave, attendance
    action: permissionActionEnum("action").notNull(),
    description: text("description"),
  },
  (t) => [
    uniqueIndex("permissions_module_action_unique").on(t.module, t.action),
    index("permissions_module_idx").on(t.module),
  ],
);

export const permissionsRelations = relations(permissions, () => ({}));
