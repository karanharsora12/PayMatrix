import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatutoryService } from './statutory.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('statutory')
@ApiBearerAuth('access-token')
@Controller('statutory')
export class StatutoryController {
  constructor(private svc: StatutoryService) {}
  @Get('rules') rules(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.rules(u.companyId, q); }
  @Post('rules') createRule(@CurrentUser() u: any, @Body() dto: any) { return this.svc.createRule(u.companyId, dto); }
  @Patch('rules/:id') updateRule(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.updateRule(u.companyId, id, dto); }
  @Get('employees/:id/details') details(@Param('id', ParseUUIDPipe) id: string) { return this.svc.details(id); }
  @Post('employees/:id/details') upsert(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.upsertDetails(id, dto); }
  @Get('employees/:id/declarations') decl(@Param('id', ParseUUIDPipe) id: string) { return this.svc.declarations(id); }
}
