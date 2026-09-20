import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}
  @Get() @RequirePermission('users.view') list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Post() @RequirePermission('users.create') create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.update(u.companyId, id, dto); }
  @Delete(':id') remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(u.companyId, id); }
}
