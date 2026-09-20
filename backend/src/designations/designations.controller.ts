import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DesignationsService } from './designations.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/create-designation.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('designations')
@ApiBearerAuth('access-token')
@Controller('designations')
export class DesignationsController {
  constructor(private svc: DesignationsService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto & { departmentId?: string }) { return this.svc.list(u.companyId, q); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Post() @RequirePermission('designations.create') create(@CurrentUser() u: any, @Body() dto: CreateDesignationDto) { return this.svc.create(u.companyId, dto, u.sub); }
  @Patch(':id') @RequirePermission('designations.edit') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDesignationDto) { return this.svc.update(u.companyId, id, dto, u.sub); }
  @Delete(':id') @RequirePermission('designations.delete') remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(u.companyId, id); }
}
