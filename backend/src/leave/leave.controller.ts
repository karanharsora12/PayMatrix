import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('leave')
@ApiBearerAuth('access-token')
@Controller('leave')
export class LeaveController {
  constructor(private svc: LeaveService) {}
  @Get('types') types(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.types(u.companyId, q); }
  @Post('types') @RequirePermission('leave.create') createType(@CurrentUser() u: any, @Body() dto: any) { return this.svc.createType(u.companyId, dto, u.sub); }
  @Post('types/:id/approve') updateType(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.updateType(u.companyId, id, dto); }
  @Delete('types/:id') deleteType(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteType(u.companyId, id); }

  @Get('requests') requests(@CurrentUser() u: any, @Query() q: PaginationDto & any) { return this.svc.requests(u.companyId, q); }
  @Post('requests') createReq(@CurrentUser() u: any, @Body() dto: any) { return this.svc.createRequest(u.companyId, dto, u.sub); }
  @Post('requests/:id/approve') approve(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.approve(u.companyId, id, u.sub); }
  @Post('requests/:id/reject') reject(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.reject(u.companyId, id, u.sub, dto?.reason); }
  @Post('requests/:id/cancel') cancel(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.cancel(u.companyId, id, u.sub); }
  @Get('calendar') calendar(@CurrentUser() u: any, @Query('from') from: string, @Query('to') to: string) { return this.svc.calendar(u.companyId, from, to); }
  @Get('employees/:id/balances') balances(@Param('id', ParseUUIDPipe) id: string) { return this.svc.balances(id); }
}
