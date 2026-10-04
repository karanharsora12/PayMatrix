import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PayslipsService } from './payslips.service';

@ApiTags('Payslips')
@ApiBearerAuth('access-token')
@Controller()
export class PayslipsController {
  constructor(private payslipsService: PayslipsService) {}

  @Get('payslips')
  @RequirePermission('payslip.view')
  @ApiOperation({ summary: 'List payslips with period and employee filters' })
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.payslipsService.list(user.companyId, query);
  }

  @Get('payslips/:id')
  @RequirePermission('payslip.view')
  @ApiOperation({ summary: 'Get full payslip snapshot details' })
  get(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.payslipsService.get(user.companyId, id);
  }

  @Get('employees/:employeeId/payslips')
  @RequirePermission('payslip.view')
  @ApiOperation({ summary: 'Get payslips history for a specific employee' })
  getEmployeePayslips(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.payslipsService.getEmployeePayslips(user.companyId, employeeId);
  }

  @Get('payslips/:id/pdf')
  @RequirePermission('payslip.view')
  @ApiOperation({ summary: 'Get printable payslip data' })
  async getPdfData(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    const res = await this.payslipsService.get(user.companyId, id);
    return {
      success: true,
      data: {
        payslip: res.data,
        url: `/api/v1/payslips/${id}`,
      },
      message: 'Payslip printable snapshot retrieved',
    };
  }

  @Get('payslips/:id/download-pdf')
  @RequirePermission('payslip.view')
  @ApiOperation({ summary: 'Download binary payslip PDF document' })
  async downloadPdf(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: any,
  ) {
    const { buffer, filename } = await this.payslipsService.getPayslipPdfBuffer(user.companyId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('payslips/calculate-preview')
  @RequirePermission('payroll.run')
  @ApiOperation({ summary: 'Calculate live preview of single employee payslip before finalization' })
  async calculatePreview(
    @CurrentUser() user: any,
    @Body() body: { employeeId: string; year: number; month: number; policy?: string },
  ) {
    return this.payslipsService.calculatePreview(
      user.companyId,
      body.employeeId,
      Number(body.year),
      Number(body.month),
      body.policy,
    );
  }

  @Post('payslips/generate-single')
  @RequirePermission('payroll.run')
  @ApiOperation({ summary: 'Generate and lock individual employee payslip snapshot' })
  async generateSingle(
    @CurrentUser() user: any,
    @Body() body: { employeeId: string; year: number; month: number; policy?: string },
  ) {
    return this.payslipsService.generateSingle(
      user.companyId,
      {
        employeeId: body.employeeId,
        year: Number(body.year),
        month: Number(body.month),
        policy: body.policy,
      },
      user.id,
    );
  }

  @Post('payslips/:id/send-email')
  @RequirePermission('payroll.run')
  @ApiOperation({ summary: 'Send payslip email to employee using Email Template Master' })
  async sendEmail(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payslipsService.sendPayslipEmail(user.companyId, id, user.id);
  }

  @Post('payslips/:id/retry-email')
  @RequirePermission('payroll.run')
  @ApiOperation({ summary: 'Retry sending payslip email using immutable snapshot' })
  async retryEmail(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payslipsService.retryPayslipEmail(user.companyId, id, user.id);
  }

  @Post('payslips/send-batch-emails')
  @RequirePermission('payroll.run')
  @ApiOperation({ summary: 'Batch dispatch payslip emails to employees' })
  async sendBatchEmails(
    @CurrentUser() user: any,
    @Body() body: { payslipIds: string[] },
  ) {
    return this.payslipsService.sendBatchPayslipEmails(user.companyId, body.payslipIds || [], user.id);
  }
}
