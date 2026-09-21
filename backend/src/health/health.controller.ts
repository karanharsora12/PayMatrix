import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Pool } from 'pg';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(Pool) private pool: Pool) {}

  @Public()
  @Get()
  async health() {
    let dbStatus = 'disconnected';
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }
    return {
      success: true,
      data: {
        status: 'ok',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'development',
      },
      message: 'Health check passed',
    };
  }
}
