import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import {
  AttendanceFilterDto,
  AttendanceSummaryFilterDto,
  CreateAttendanceDto,
  CreateAttendancePunchDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth('access-token')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  @Get()
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'List attendance records with server-side filters' })
  list(@CurrentUser() u: any, @Query() q: AttendanceFilterDto) {
    return this.svc.list(u.companyId, q);
  }

  @Get('summary')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get workforce attendance summary KPIs' })
  summary(@CurrentUser() u: any, @Query() q: AttendanceSummaryFilterDto) {
    return this.svc.summary(u.companyId, q);
  }

  @Get('calendar')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get attendance calendar grouped by month' })
  calendar(
    @CurrentUser() u: any,
    @Query('employeeId') empId?: string,
    @Query('month') month?: string,
  ) {
    return this.svc.calendar(u.companyId, empId, month);
  }

  @Get('logs')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get raw attendance punch logs' })
  getPunches(
    @CurrentUser() u: any,
    @Query('employeeId') employeeId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.svc.getPunches(u.companyId, { employeeId, fromDate, toDate });
  }

  @Post('logs')
  @RequirePermission('attendance.create')
  @ApiOperation({ summary: 'Record raw attendance punch' })
  recordPunch(@CurrentUser() u: any, @Body() dto: CreateAttendancePunchDto) {
    return this.svc.recordPunch(u.companyId, dto);
  }

  @Get('employees/:id')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get attendance history for a specific employee' })
  getEmployeeAttendance(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getEmployeeAttendance(u.companyId, empId, {
      fromDate,
      toDate,
      status,
    });
  }

  @Get(':id')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u.companyId, id);
  }

  @Post()
  @RequirePermission('attendance.create')
  @ApiOperation({ summary: 'Record manual or calculated attendance' })
  create(@CurrentUser() u: any, @Body() dto: CreateAttendanceDto) {
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('attendance.edit')
  @ApiOperation({ summary: 'Update attendance record' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.svc.update(u.companyId, id, dto, u.sub);
  }
}
