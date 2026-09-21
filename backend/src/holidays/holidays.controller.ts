import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import {
  CreateHolidayDto,
  HolidayFilterDto,
  UpdateHolidayDto,
} from './dto/holiday.dto';

@ApiTags('holidays')
@ApiBearerAuth('access-token')
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly svc: HolidaysService) {}

  @Get()
  @RequirePermission('holiday.view')
  @ApiOperation({ summary: 'List holidays with year/month/type filters' })
  list(@CurrentUser() u: any, @Query() q: HolidayFilterDto) {
    return this.svc.list(u.companyId, q);
  }

  @Get(':id')
  @RequirePermission('holiday.view')
  @ApiOperation({ summary: 'Get holiday by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u.companyId, id);
  }

  @Post()
  @RequirePermission('holiday.create')
  @ApiOperation({ summary: 'Create a new holiday' })
  create(@CurrentUser() u: any, @Body() dto: CreateHolidayDto) {
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('holiday.edit')
  @ApiOperation({ summary: 'Update a holiday' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.svc.update(u.companyId, id, dto, u.sub);
  }

  @Delete(':id')
  @RequirePermission('holiday.delete')
  @ApiOperation({ summary: 'Delete a holiday' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u.companyId, id, u.sub);
  }
}
