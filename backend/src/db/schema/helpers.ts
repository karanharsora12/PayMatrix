import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Common column helpers to keep schema DRY while staying explicit for Drizzle Kit.
 * We intentionally do NOT abstract away per-table indexes/uniques — those must be
 * declared inline so `drizzle-kit` can introspect them correctly.
 */

export const pk = () =>
  uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`);

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
} as const;

export const softDeleteCol = timestamp("deleted_at", { withTimezone: true });

/** Utility: numeric(18,2) for monetary values. */
export const monetary = { precision: 18, scale: 2 } as const;
/** Utility: numeric(12,4) for rates / quantities / hours. */
export const ratePrecision = { precision: 12, scale: 4 } as const;
