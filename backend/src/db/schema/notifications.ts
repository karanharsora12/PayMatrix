import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./companies";
import { notificationTypeEnum } from "./enums";
import { pk, timestamps } from "./helpers";
import { users } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id: pk(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: uuid("entity_id"),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notifications_company_id_idx").on(t.companyId),
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_is_read_idx").on(t.isRead),
    index("notifications_type_idx").on(t.type),
    index("notifications_created_at_idx").on(t.createdAt),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: notificationTypeEnum("notification_type").notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    uniqueIndex("notification_preferences_user_type_unique").on(t.userId, t.notificationType),
    index("notification_preferences_user_id_idx").on(t.userId),
  ],
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  company: one(companies, { fields: [notifications.companyId], references: [companies.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));
