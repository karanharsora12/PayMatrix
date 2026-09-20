import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('attendance')
@ApiBearerAuth('access-token')
@Controller('attendance')
export class AttendanceController {
  constructor(private svc: AttendanceService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto & any) { return this.svc.list(u.companyId, q); }
  @Get('summary') summary(@CurrentUser() u: any, @Query('fromDate') from: string, @Query('toDate') to: string) { return this.svc.summary(u.companyId, from, to); }
  @Get('calendar') calendar(@CurrentUser() u: any, @Query('employeeId') emp: string, @Query('month') month: string) { return this.svc.calendar(u.companyId, emp, month); }
  @Post() @RequirePermission('attendance.create') create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.update(u.companyId, id, dto, u.sub); }
}
