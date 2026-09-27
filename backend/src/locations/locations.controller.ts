import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/create-location.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('locations')
@ApiBearerAuth('access-token')
@Controller('locations')
export class LocationsController {
  constructor(private svc: LocationsService) {}

  @Get()
  @RequirePermission('locations.view')
  list(@Query() q: PaginationDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  @RequirePermission('locations.view')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(id);
  }

  @Post()
  @RequirePermission('locations.create')
  create(@Body() dto: CreateLocationDto, @CurrentUser() user: any) {
    return this.svc.create(dto, user?.companyId);
  }

  @Patch(':id')
  @RequirePermission('locations.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLocationDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('locations.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
