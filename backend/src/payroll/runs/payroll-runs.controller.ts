import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PayrollAdjustmentsService } from '../adjustments/payroll-adjustments.service';
import { PayslipsService } from '../payslips/payslips.service';
import {
  ApprovePayrollRunDto,
  CreatePayrollRunDto,
  PayrollAdjustmentDto,
  PayrollRunFilterDto,
} from './dto/payroll-run.dto';
import { PayrollRunsService } from './payroll-runs.service';

@ApiTags('Payroll')
@ApiBearerAuth('access-token')
@Controller('payroll')
export class PayrollRunsController {
  constructor(
    private runsService: PayrollRunsService,
    private adjustmentsService: PayrollAdjustmentsService,
    private payslipsService: PayslipsService,
  ) {}

  @Get('runs')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'List payroll runs for current company' })
  list(@CurrentUser() user: any, @Query() filter: PayrollRunFilterDto) {
    return this.runsService.list(user.companyId, filter);
  }

  @Post('runs')
  @RequirePermission('payroll.create')
  @ApiOperation({ summary: 'Create a new draft payroll run' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreatePayrollRunDto,
  ) {
    return this.runsService.create(user.companyId, dto, user.sub);
  }

  @Get('runs/:id')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Get payroll run details by ID' })
  get(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.get(user.companyId, id);
  }

  @Get('runs/:id/summary')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Get summary and department breakdown of payroll run' })
  getSummary(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.getSummary(user.companyId, id);
  }

  @Post('runs/:id/calculate')
  @RequirePermission('payroll.calculate')
  @ApiOperation({ summary: 'Calculate or recalculate payroll run' })
  calculate(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('policy') policy?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY',
  ) {
    return this.runsService.calculate(user.companyId, id, user.sub, policy);
  }

  @Post('runs/:id/recalculate')
  @RequirePermission('payroll.recalculate')
  @ApiOperation({ summary: 'Recalculate payroll run' })
  recalculate(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('policy') policy?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY',
  ) {
    return this.runsService.calculate(user.companyId, id, user.sub, policy);
  }

  @Post('runs/:id/submit')
  @RequirePermission('payroll.submit')
  @ApiOperation({ summary: 'Submit payroll run for approval' })
  submit(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.submit(user.companyId, id, user.sub);
  }

  @Post('runs/:id/approve')
  @RequirePermission('payroll.approve')
  @ApiOperation({ summary: 'Approve payroll run' })
  approve(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePayrollRunDto,
  ) {
    return this.runsService.approve(user.companyId, id, user.sub, dto);
  }

  @Post('runs/:id/finalize')
  @RequirePermission('payroll.finalize')
  @ApiOperation({ summary: 'Finalize payroll run and generate payslips' })
  finalize(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.finalize(user.companyId, id, user.sub);
  }

  @Post('runs/:id/cancel')
  @RequirePermission('payroll.cancel')
  @ApiOperation({ summary: 'Cancel payroll run' })
  cancel(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.runsService.cancel(user.companyId, id, user.sub);
  }

  @Get('runs/:id/employees')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'List employees snapshot for a payroll run' })
  getEmployees(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: any,
  ) {
    return this.runsService.getEmployees(user.companyId, id, query);
  }

  @Get('runs/:id/employees/:employeeId')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Get employee snapshot details in a payroll run' })
  getEmployee(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.runsService.getEmployee(user.companyId, id, employeeId);
  }

  @Get('runs/:id/employees/:employeeId/components')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'Get employee component breakdown and totals' })
  getEmployeeComponents(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.runsService.getEmployeeComponents(user.companyId, id, employeeId);
  }

  @Post('runs/:id/employees/:employeeId/adjustments')
  @RequirePermission('payroll.calculate')
  @ApiOperation({ summary: 'Add pre-finalization payroll adjustment for an employee' })
  addAdjustment(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: PayrollAdjustmentDto,
  ) {
    return this.adjustmentsService.addAdjustment(
      user.companyId,
      id,
      employeeId,
      dto,
      user.sub,
    );
  }

  @Get('runs/:id/employees/:employeeId/adjustments')
  @RequirePermission('payroll.view')
  @ApiOperation({ summary: 'List payroll adjustments for an employee' })
  listAdjustments(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.adjustmentsService.listAdjustments(user.companyId, id, employeeId);
  }

  @Delete('adjustments/:adjustmentId')
  @RequirePermission('payroll.calculate')
  @ApiOperation({ summary: 'Delete a payroll adjustment' })
  deleteAdjustment(
    @CurrentUser() user: any,
    @Param('adjustmentId', ParseUUIDPipe) adjustmentId: string,
  ) {
    return this.adjustmentsService.deleteAdjustment(
      user.companyId,
      adjustmentId,
      user.sub,
    );
  }

  @Post('runs/:id/payslips/generate')
  @RequirePermission('payslip.generate')
  @ApiOperation({ summary: 'Generate payslips for a payroll run' })
  generatePayslips(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payslipsService.generateForRun(user.companyId, id);
  }
}
