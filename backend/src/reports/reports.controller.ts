import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}
  @Get('employees') employees(@CurrentUser() u: any, @Query() q: any) { return this.svc.employees(u.companyId, q); }
  @Get('attendance') attendance(@CurrentUser() u: any, @Query() q: any) { return this.svc.attendance(u.companyId, q); }
  @Get('leave') leave(@CurrentUser() u: any, @Query() q: any) { return this.svc.leave(u.companyId, q); }
  @Get('payroll') payroll(@CurrentUser() u: any, @Query() q: any) { return this.svc.payroll(u.companyId, q); }
  @Get('salary') salary(@CurrentUser() u: any, @Query() q: any) { return this.svc.salary(u.companyId, q); }
  @Get('tax') tax(@CurrentUser() u: any, @Query() q: any) { return this.svc.tax(u.companyId, q); }
  @Get('bank-payment') bank(@CurrentUser() u: any, @Query('payrollRunId') id: string) { return this.svc.bankPayment(u.companyId, id); }
  @Get(':type/export') exportReport() { return { success: true, data: { url: 'stub-export-url' }, message: 'Export queued (BullMQ stub)' }; }
}
