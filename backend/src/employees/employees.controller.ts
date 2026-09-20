import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(private svc: EmployeesService) {}

  @Get()
  @RequirePermission('employees.view')
  list(@CurrentUser() u: any, @Query() q: PaginationDto & any) {
    const { page, pageSize, search, sortBy, sortOrder, ...filters } = q;
    const pagination = Object.assign(new PaginationDto(), { page: Number(page ?? 1), pageSize: Number(pageSize ?? 20), search, sortBy, sortOrder });
    return this.svc.list(u.companyId, filters, pagination);
  }

  @Get(':id')
  @RequirePermission('employees.view')
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u.companyId, id);
  }

  @Get(':id/history')
  history(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.history(u.companyId, id);
  }

  @Post()
  @RequirePermission('employees.create')
  create(@CurrentUser() u: any, @Body() dto: CreateEmployeeDto) {
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('employees.edit')
  update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto) {
    return this.svc.update(u.companyId, id, dto, u.sub);
  }

  @Delete(':id')
  @RequirePermission('employees.delete')
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u.companyId, id, u.sub);
  }
}
