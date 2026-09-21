import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
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
}
