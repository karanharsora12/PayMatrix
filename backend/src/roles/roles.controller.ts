import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
export class RolesController {
  constructor(private svc: RolesService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.update(u.companyId, id, dto); }
  @Get('permissions/all') perms() { return this.svc.permissions(); }
}
