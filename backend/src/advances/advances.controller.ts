import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdvancesService } from './advances.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('advances')
@ApiBearerAuth('access-token')
@Controller('advances')
export class AdvancesController {
  constructor(private svc: AdvancesService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.update(u.companyId, id, dto); }
}
