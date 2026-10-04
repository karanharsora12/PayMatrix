import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { ParametersService } from '../parameters/parameters.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveCalendarFilterDto,
  LeaveRequestFilterDto,
  RejectLeaveDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

@ApiTags('leave')
@ApiBearerAuth('access-token')
@Controller('leave')
export class LeaveController {
  constructor(
    private readonly svc: LeaveService,
    private readonly paramsSvc: ParametersService,
  ) {}

  private async checkCanManageLeave(u: any): Promise<boolean> {
    const val = await this.paramsSvc.getUserParameterValue(
      u.companyId,
      u.sub,
      'CanManageLeave',
      u.employeeId,
    );
    return val === true;
  }

  // ---------------------------------------------------------------------------
  // Leave Types
  // ---------------------------------------------------------------------------
  @Get('types')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'List leave types' })
  types(@CurrentUser() u: any, @Query() q: PaginationDto) {
    return this.svc.types(u.companyId, q);
  }

  @Get('types/:id')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave type by ID' })
  getType(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getType(u.companyId, id);
  }

  @Post('types')
  @RequirePermission('leave.create')
  @ApiOperation({ summary: 'Create a new leave type' })
  async createType(@CurrentUser() u: any, @Body() dto: CreateLeaveTypeDto) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Permission denied: Cannot create leave types (CanManageLeave = false)',
      });
    }
    return this.svc.createType(u.companyId, dto, u.sub);
  }

  @Patch('types/:id')
  @RequirePermission('leave.edit')
  @ApiOperation({ summary: 'Update leave type' })
  async updateType(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Permission denied: Cannot update leave types (CanManageLeave = false)',
      });
    }
    return this.svc.updateType(u.companyId, id, dto, u.sub);
  }

  @Delete('types/:id')
  @RequirePermission('leave.edit')
  @ApiOperation({ summary: 'Delete leave type' })
  async deleteType(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Permission denied: Cannot delete leave types (CanManageLeave = false)',
      });
    }
    return this.svc.deleteType(u.companyId, id, u.sub);
  }

  // ---------------------------------------------------------------------------
  // Leave Requests & Workflow
  // ---------------------------------------------------------------------------
  @Get('requests')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'List leave requests with filters' })
  async requests(@CurrentUser() u: any, @Query() q: LeaveRequestFilterDto) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      q.employeeId = u.employeeId;
    }
    return this.svc.requests(u.companyId, q);
  }

  @Get('requests/:id')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave request by ID' })
  async getRequest(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    const res = await this.svc.getRequest(u.companyId, id);
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      if (!u.employeeId || (res as any)?.data?.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Access denied: not authorized to view leave request of other employees',
        });
      }
    }
    return res;
  }

  @Post('requests')
  @RequirePermission('leave.create')
  @ApiOperation({ summary: 'Submit a new leave request' })
  async createRequest(@CurrentUser() u: any, @Body() dto: CreateLeaveRequestDto) {
    const canManage = await this.checkCanManageLeave(u);
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
            'Permission denied: Cannot submit leave request for other employees (CanManageLeave = false)',
        });
      }
    }
    return this.svc.createRequest(u.companyId, dto, u.sub);
  }

  @Post('requests/:id/approve')
  @RequirePermission('leave.approve')
  @ApiOperation({ summary: 'Approve leave request and deduct balance' })
  async approve(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Permission denied: Cannot approve leave requests (CanManageLeave = false)',
      });
    }
    return this.svc.approve(u.companyId, id, u.sub);
  }

  @Post('requests/:id/reject')
  @RequirePermission('leave.reject')
  @ApiOperation({ summary: 'Reject leave request with reason' })
  async reject(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLeaveDto,
  ) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Permission denied: Cannot reject leave requests (CanManageLeave = false)',
      });
    }
    return this.svc.reject(u.companyId, id, u.sub, dto);
  }

  @Post('requests/:id/cancel')
  @RequirePermission('leave.cancel')
  @ApiOperation({ summary: 'Cancel leave request and restore balance if approved' })
  async cancel(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      const existing = await this.svc.getRequest(u.companyId, id);
      if (!u.employeeId || (existing as any)?.data?.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Permission denied: You can only cancel your own leave requests',
        });
      }
    }
    return this.svc.cancel(u.companyId, id, u.sub);
  }

  // ---------------------------------------------------------------------------
  // Leave Calendar & Balances
  // ---------------------------------------------------------------------------
  @Get('calendar')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave calendar events' })
  async calendar(@CurrentUser() u: any, @Query() q: LeaveCalendarFilterDto) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      if (!u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'No employee record associated with current user',
        });
      }
      if (q.employeeId && q.employeeId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are only authorized to view your own leave calendar',
        });
      }
      q.employeeId = u.employeeId;
    }
    return this.svc.calendar(u.companyId, q);
  }

  @Get('employees/:id/balances')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave balances for an employee' })
  async balances(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('year') year?: number,
  ) {
    const canManage = await this.checkCanManageLeave(u);
    if (!canManage) {
      if (!u.employeeId || empId !== u.employeeId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You are only authorized to view your own leave balances',
        });
      }
    }
    return this.svc.balances(u.companyId, empId, year);
  }
}
