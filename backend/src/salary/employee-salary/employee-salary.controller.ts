import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeSalaryService } from './employee-salary.service';
import {
  AssignEmployeeSalaryDto,
  CancelSalaryDto,
  SalaryPreviewQueryDto,
} from './dto/employee-salary.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('employee-salary')
@ApiBearerAuth('access-token')
@Controller('employees/:employeeId/salary')
export class EmployeeSalaryController {
  constructor(private readonly service: EmployeeSalaryService) {}

  @Get()
  @RequirePermission('salary.employee.view')
  @ApiOperation({ summary: 'Get current active salary configuration for employee' })
  getCurrentSalary(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.getCurrentSalary(user.companyId, employeeId);
  }

  @Get('current')
  @RequirePermission('salary.employee.view')
  @ApiOperation({ summary: 'Alias to get current active salary configuration' })
  getCurrentSalaryAlias(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.getCurrentSalary(user.companyId, employeeId);
  }

  @Get('history')
  @RequirePermission('salary.employee.view')
  @ApiOperation({ summary: 'Get complete salary assignment history for employee' })
  getSalaryHistory(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.service.getSalaryHistory(user.companyId, employeeId);
  }

  @Post()
  @RequirePermission('salary.employee.assign')
  @ApiOperation({ summary: 'Assign a new salary structure or revise employee salary' })
  assignOrReviseSalary(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: AssignEmployeeSalaryDto,
  ) {
    return this.service.assignOrReviseSalary(user.companyId, employeeId, dto, user.sub);
  }

  @Post(':salaryId/cancel')
  @RequirePermission('salary.employee.cancel')
  @ApiOperation({ summary: 'Cancel a salary assignment record' })
  cancelSalary(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('salaryId', ParseUUIDPipe) salaryId: string,
    @Body() dto: CancelSalaryDto,
  ) {
    return this.service.cancelSalary(user.companyId, employeeId, salaryId, dto, user.sub);
  }

  @Get('preview')
  @RequirePermission('salary.preview.view')
  @ApiOperation({ summary: 'Preview monthly salary calculation integrated with attendance and approved leaves' })
  getSalaryPreview(
    @CurrentUser() user: any,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query() query: SalaryPreviewQueryDto,
  ) {
    return this.service.getSalaryPreview(user.companyId, employeeId, query);
  }
}
