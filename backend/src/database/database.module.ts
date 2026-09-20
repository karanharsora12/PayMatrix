import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: Pool,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:Karan%40123@localhost:5432/paymatrix';
        return new Pool({ connectionString, max: 10 });
      },
    },
    {
      provide: DRIZZLE,
      inject: [Pool],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
  ],
  exports: [Pool, DRIZZLE],
})
export class DatabaseModule {}

