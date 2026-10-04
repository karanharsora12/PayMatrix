import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: Pool,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined in .env');
        }
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

