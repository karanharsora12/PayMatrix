import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { emailLogStatusEnum, emailTemplateStatusEnum } from "./enums";
import { pk, timestamps } from "./helpers";
import { users } from "./users";

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    templateCode: varchar("template_code", { length: 100 }).notNull(),
    templateName: varchar("template_name", { length: 255 }).notNull(),
    templateType: varchar("template_type", { length: 80 }).notNull(), // Payslip, Leave, Attendance, Employee, General, etc.
    description: text("description"),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    status: emailTemplateStatusEnum("status").default("ACTIVE").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("email_templates_company_code_unique").on(t.companyId, t.templateCode),
    index("email_templates_company_id_idx").on(t.companyId),
    index("email_templates_type_idx").on(t.templateType),
    index("email_templates_status_idx").on(t.status),
    index("email_templates_is_default_idx").on(t.isDefault),
  ],
);

export const emailTemplateVersions = pgTable(
  "email_template_versions",
  {
    id: pk(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => emailTemplates.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),
    changeSummary: text("change_summary"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("email_template_versions_tpl_ver_unique").on(t.templateId, t.versionNo),
    index("email_template_versions_tpl_idx").on(t.templateId),
  ],
);

export const emailLogs = pgTable(
  "email_logs",
  {
    id: pk(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => emailTemplates.id, {
      onDelete: "set null",
    }),
    referenceType: varchar("reference_type", { length: 80 }), // Payslip, Leave, Attendance, Test, etc.
    referenceId: varchar("reference_id", { length: 255 }),
    toEmail: varchar("to_email", { length: 255 }).notNull(),
    cc: text("cc"),
    bcc: text("bcc"),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html"),
    status: emailLogStatusEnum("status").default("PENDING").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("email_logs_company_id_idx").on(t.companyId),
    index("email_logs_template_id_idx").on(t.templateId),
    index("email_logs_ref_idx").on(t.referenceType, t.referenceId),
    index("email_logs_status_idx").on(t.status),
    index("email_logs_created_at_idx").on(t.createdAt),
  ],
);

export const emailTemplatesRelations = relations(emailTemplates, ({ one, many }) => ({
  company: one(companies, { fields: [emailTemplates.companyId], references: [companies.id] }),
  creator: one(users, { fields: [emailTemplates.createdBy], references: [users.id] }),
  updater: one(users, { fields: [emailTemplates.updatedBy], references: [users.id] }),
  versions: many(emailTemplateVersions),
  logs: many(emailLogs),
}));

export const emailTemplateVersionsRelations = relations(emailTemplateVersions, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailTemplateVersions.templateId],
    references: [emailTemplates.id],
  }),
  creator: one(users, { fields: [emailTemplateVersions.createdBy], references: [users.id] }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  company: one(companies, { fields: [emailLogs.companyId], references: [companies.id] }),
  template: one(emailTemplates, { fields: [emailLogs.templateId], references: [emailTemplates.id] }),
  creator: one(users, { fields: [emailLogs.createdBy], references: [users.id] }),
}));
