import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ParametersService } from '../parameters/parameters.service';
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
  constructor(
    private readonly svc: AttendanceService,
    private readonly paramsSvc: ParametersService,
  ) {}

  private async checkCanManageAttendance(u: any): Promise<boolean> {
    const val = await this.paramsSvc.getUserParameterValue(
      u.companyId,
      u.sub,
      'CanManageAttendance',
      u.employeeId,
    );
    return val === true;
  }

  @Get()
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'List attendance records with server-side filters' })
  async list(@CurrentUser() u: any, @Query() q: AttendanceFilterDto) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      q.employeeId = u.employeeId;
    }
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
  async calendar(
    @CurrentUser() u: any,
    @Query('employeeId') empId?: string,
    @Query('month') month?: string,
  ) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      if (empId && empId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are only authorized to view your own attendance calendar',
        });
      }
      empId = u.employeeId;
    }
    return this.svc.calendar(u.companyId, empId, month);
  }

  @Get('logs')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get raw attendance punch logs' })
  async getPunches(
    @CurrentUser() u: any,
    @Query('employeeId') employeeId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      if (employeeId && employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are only authorized to view your own punch logs',
        });
      }
      employeeId = u.employeeId;
    }
    return this.svc.getPunches(u.companyId, { employeeId, fromDate, toDate });
  }

  @Post('logs')
  @RequirePermission('attendance.create')
  @ApiOperation({ summary: 'Record raw attendance punch' })
  async recordPunch(@CurrentUser() u: any, @Body() dto: CreateAttendancePunchDto) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      if (dto.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You can only record attendance punches for yourself',
        });
      }
    }
    return this.svc.recordPunch(u.companyId, dto);
  }

  @Get('employees/:id')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get attendance history for a specific employee' })
  async getEmployeeAttendance(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId || empId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are only authorized to view your own attendance history',
        });
      }
    }
    return this.svc.getEmployeeAttendance(u.companyId, empId, {
      fromDate,
      toDate,
      status,
    });
  }

  @Get(':id')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  async get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    const record = await this.svc.get(u.companyId, id);
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId || (record as any)?.data?.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Access denied: not authorized to view attendance of other employees',
        });
      }
    }
    return record;
  }

  @Post()
  @RequirePermission('attendance.create')
  @ApiOperation({ summary: 'Record manual or calculated attendance' })
  async create(@CurrentUser() u: any, @Body() dto: CreateAttendanceDto) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      if (dto.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message:
            'Permission denied: Cannot manage attendance for other employees (CanManageAttendance = false)',
        });
      }
    }
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('attendance.edit')
  @ApiOperation({ summary: 'Update attendance record' })
  async update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    const canManage = await this.checkCanManageAttendance(u);
    if (!canManage) {
      const existing = await this.svc.get(u.companyId, id);
      if (
        !u.employeeId ||
        (existing as any)?.data?.employeeId !== u.employeeId
      ) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message:
            'Permission denied: Cannot update attendance for other employees (CanManageAttendance = false)',
        });
      }
    }
    return this.svc.update(u.companyId, id, dto, u.sub);
  }
}
