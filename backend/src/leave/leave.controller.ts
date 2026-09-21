import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
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
  constructor(private readonly svc: LeaveService) {}

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
  createType(@CurrentUser() u: any, @Body() dto: CreateLeaveTypeDto) {
    return this.svc.createType(u.companyId, dto, u.sub);
  }

  @Patch('types/:id')
  @RequirePermission('leave.edit')
  @ApiOperation({ summary: 'Update leave type' })
  updateType(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.svc.updateType(u.companyId, id, dto, u.sub);
  }

  @Delete('types/:id')
  @RequirePermission('leave.edit')
  @ApiOperation({ summary: 'Delete leave type' })
  deleteType(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.deleteType(u.companyId, id, u.sub);
  }

  // ---------------------------------------------------------------------------
  // Leave Requests & Workflow
  // ---------------------------------------------------------------------------
  @Get('requests')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'List leave requests with filters' })
  requests(@CurrentUser() u: any, @Query() q: LeaveRequestFilterDto) {
    return this.svc.requests(u.companyId, q);
  }

  @Get('requests/:id')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave request by ID' })
  getRequest(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getRequest(u.companyId, id);
  }

  @Post('requests')
  @RequirePermission('leave.create')
  @ApiOperation({ summary: 'Submit a new leave request' })
  createRequest(@CurrentUser() u: any, @Body() dto: CreateLeaveRequestDto) {
    return this.svc.createRequest(u.companyId, dto, u.sub);
  }

  @Post('requests/:id/approve')
  @RequirePermission('leave.approve')
  @ApiOperation({ summary: 'Approve leave request and deduct balance' })
  approve(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.approve(u.companyId, id, u.sub);
  }

  @Post('requests/:id/reject')
  @RequirePermission('leave.reject')
  @ApiOperation({ summary: 'Reject leave request with reason' })
  reject(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.svc.reject(u.companyId, id, u.sub, dto);
  }

  @Post('requests/:id/cancel')
  @RequirePermission('leave.cancel')
  @ApiOperation({ summary: 'Cancel leave request and restore balance if approved' })
  cancel(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.cancel(u.companyId, id, u.sub);
  }

  // ---------------------------------------------------------------------------
  // Leave Calendar & Balances
  // ---------------------------------------------------------------------------
  @Get('calendar')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave calendar events' })
  calendar(@CurrentUser() u: any, @Query() q: LeaveCalendarFilterDto) {
    return this.svc.calendar(u.companyId, q);
  }

  @Get('employees/:id/balances')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get leave balances for an employee' })
  balances(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('year') year?: number,
  ) {
    return this.svc.balances(u.companyId, empId, year);
  }
}
