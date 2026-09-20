/**
 * PayMatrix — DB connection (Drizzle + pg)
 *
 * Usage (server / NestJS):
 *   import { db } from "@/db";
 *   const employees = await db.query.employees.findMany(...);
 *
 * Requires `pg` driver. Install: npm i pg && npm i -D @types/pg
 *
 * Keep this file free of React imports — it's server-only.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/paymatrix";

export const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export * from "./schema";
export type Schema = typeof schema;
