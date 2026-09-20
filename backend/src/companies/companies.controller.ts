import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('companies')
@ApiBearerAuth('access-token')
@Controller('companies')
export class CompaniesController {
  constructor(private svc: CompaniesService) {}

  @Get()
  @RequirePermission('companies.view')
  list(@Query() q: PaginationDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(id);
  }

  @Public()
  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.svc.create(dto, user?.sub);
  }

  @Patch(':id')
  @RequirePermission('companies.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompanyDto, @CurrentUser() user: any) {
    return this.svc.update(id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('companies.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
