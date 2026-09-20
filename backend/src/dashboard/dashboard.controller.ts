import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}
  @Get('summary') summary(@CurrentUser() u: any) { return this.svc.summary(u.companyId); }
  @Get('payroll') payroll(@CurrentUser() u: any) { return this.svc.summary(u.companyId); }
  @Get('attendance') attendance(@CurrentUser() u: any) { return this.svc.summary(u.companyId); }
  @Get('leave') leave(@CurrentUser() u: any) { return this.svc.summary(u.companyId); }
}
