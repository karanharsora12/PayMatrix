export * from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
export type Db = NodePgDatabase<typeof schema>;

