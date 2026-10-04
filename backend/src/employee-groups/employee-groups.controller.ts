import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployeeGroupsService } from './employee-groups.service';
import { CreateEmployeeGroupDto, UpdateEmployeeGroupDto } from './dto/create-employee-group.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('employee-groups')
@ApiBearerAuth('access-token')
@Controller('employee-groups')
export class EmployeeGroupsController {
  constructor(private readonly service: EmployeeGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List employee groups' })
  list(@CurrentUser() u: any, @Query() q: PaginationDto) {
    return this.service.list(u.companyId, Object.assign(new PaginationDto(), q));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(u.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new group' })
  create(@CurrentUser() u: any, @Body() dto: CreateEmployeeGroupDto) {
    return this.service.create(u.companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group' })
  update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeGroupDto) {
    return this.service.update(u.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(u.companyId, id);
  }
}
