import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardSummaryQueryDto } from './dto/dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Permission-aware aggregated dashboard summary' })
  summary(@CurrentUser() u: any, @Query() q: DashboardSummaryQueryDto) {
    return this.svc.summary(u, q?.period ?? 'week');
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Dashboard attendance slice' })
  attendance(@CurrentUser() u: any, @Query() q: DashboardSummaryQueryDto) {
    return this.svc.summary(u, q?.period ?? 'week');
  }

  @Get('leave')
  @ApiOperation({ summary: 'Dashboard leave slice' })
  leave(@CurrentUser() u: any, @Query() q: DashboardSummaryQueryDto) {
    return this.svc.summary(u, q?.period ?? 'week');
  }

  @Get('payroll')
  @ApiOperation({ summary: 'Dashboard payroll slice' })
  payroll(@CurrentUser() u: any, @Query() q: DashboardSummaryQueryDto) {
    return this.svc.summary(u, q?.period ?? 'week');
  }
}
