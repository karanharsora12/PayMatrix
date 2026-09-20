import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('departments')
@ApiBearerAuth('access-token')
@Controller('departments')
export class DepartmentsController {
  constructor(private svc: DepartmentsService) {}
  @Get() @RequirePermission('departments.view') list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Get(':id/employees') employees(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Query() q: PaginationDto) { return this.svc.employees(u.companyId, id, q); }
  @Post() @RequirePermission('departments.create') create(@CurrentUser() u: any, @Body() dto: CreateDepartmentDto) { return this.svc.create(u.companyId, dto, u.sub); }
  @Patch(':id') @RequirePermission('departments.edit') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto) { return this.svc.update(u.companyId, id, dto, u.sub); }
  @Delete(':id') @RequirePermission('departments.delete') remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(u.companyId, id); }
}
