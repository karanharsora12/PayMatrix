import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('shifts')
@ApiBearerAuth('access-token')
@Controller('shifts')
export class ShiftsController {
  constructor(private svc: ShiftsService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Post() @RequirePermission('shifts.create') create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.update(u.companyId, id, dto, u.sub); }
  @Delete(':id') remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(u.companyId, id); }
  @Post('employees/:employeeId/assign') assign(@CurrentUser() u: any, @Param('employeeId', ParseUUIDPipe) empId: string, @Body() dto: any) { return this.svc.assign(u.companyId, empId, dto.shiftId, dto.effectiveFrom, dto.effectiveTo); }
  @Get('employees/:employeeId/assignments') assignments(@Param('employeeId', ParseUUIDPipe) empId: string) { return this.svc.assignments(empId); }
}
