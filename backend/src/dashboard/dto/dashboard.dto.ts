import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({
    enum: ['day', 'week', 'month'],
    default: 'week',
    description: 'Period used for attendance and leave trends',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period?: 'day' | 'week' | 'month';
}
