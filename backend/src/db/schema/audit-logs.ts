import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { auditActionEnum } from "./enums";
import { pk } from "./helpers";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    module: varchar("module", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    action: auditActionEnum("action").notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_company_id_idx").on(t.companyId),
    index("audit_logs_user_id_idx").on(t.userId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_module_idx").on(t.module),
    index("audit_logs_created_at_idx").on(t.createdAt),
    index("audit_logs_company_entity_idx").on(t.companyId, t.entityType, t.entityId),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  company: one(companies, { fields: [auditLogs.companyId], references: [companies.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
