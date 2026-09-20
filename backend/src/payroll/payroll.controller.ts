import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('payroll')
@ApiBearerAuth('access-token')
@Controller('payroll')
export class PayrollController {
  constructor(private svc: PayrollService) {}
  @Get('runs') @RequirePermission('payroll.view') list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Get('runs/:id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Post('runs') @RequirePermission('payroll.create') create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Post('runs/:id/calculate') @RequirePermission('payroll.calculate') calculate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.calculate(u.companyId, id, u.sub); }
  @Post('runs/:id/recalculate') recalc(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.calculate(u.companyId, id, u.sub); }
  @Post('runs/:id/submit') submit(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.submit(u.companyId, id); }
  @Post('runs/:id/approve') @RequirePermission('payroll.approve') approve(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.approve(u.companyId, id, u.sub, dto?.comments); }
  @Post('runs/:id/finalize') @RequirePermission('payroll.finalize') finalize(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.finalize(u.companyId, id, u.sub); }
  @Post('runs/:id/cancel') cancel(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.cancel(u.companyId, id); }
  @Get('runs/:id/payslips') payslips(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.payslips(u.companyId, id); }
  @Get('payslips/:id/pdf') pdf(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return { success: true, data: { url: `/api/v1/payroll/payslips/${id}/pdf` }, message: 'PDF url (stub: generate from snapshot)' }; }
}
