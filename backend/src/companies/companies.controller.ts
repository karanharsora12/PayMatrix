import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
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

  @Get(':id/work-policy')
  getWorkPolicy(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getWorkPolicy(id);
  }

  @Put(':id/work-policy')
  @RequirePermission('settings.edit')
  putWorkPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.svc.updateWorkPolicy(id, body, user?.sub);
  }

  @Patch(':id/work-policy')
  @RequirePermission('settings.edit')
  patchWorkPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.svc.updateWorkPolicy(id, body, user?.sub);
  }

  @Get(':id/calendar-preview')
  previewCalendar(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    return this.svc.previewCalendar(id, y, m);
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

