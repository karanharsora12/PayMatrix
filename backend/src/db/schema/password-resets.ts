import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const passwordResetOtps = pgTable('password_reset_otps', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
