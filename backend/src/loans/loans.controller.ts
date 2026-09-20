import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('loans')
@ApiBearerAuth('access-token')
@Controller('loans')
export class LoansController {
  constructor(private svc: LoansService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.companyId, q); }
  @Get(':id') get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.get(u.companyId, id); }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.svc.create(u.companyId, dto, u.sub); }
  @Post(':id/approve') approve(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.approve(u.companyId, id); }
  @Post(':id/reject') reject(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.reject(u.companyId, id); }
  @Post(':id/disburse') disburse(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.disburse(u.companyId, id); }
  @Get(':id/installments') installments(@Param('id', ParseUUIDPipe) id: string) { return this.svc.installments(id); }
}
