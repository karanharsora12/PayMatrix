import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('salary')
@ApiBearerAuth('access-token')
@Controller('salary')
export class SalaryController {
  constructor(private svc: SalaryService) {}
  @Get('components') components(@CurrentUser() u: any, @Query() q: PaginationDto & any) { return this.svc.listComponents(u.companyId, q); }
  @Post('components') @RequirePermission('salary.create') createComp(@CurrentUser() u: any, @Body() dto: any) { return this.svc.createComponent(u.companyId, dto, u.sub); }
  @Post('components/:id') updateComp(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.updateComponent(u.companyId, id, dto); }
  @Delete('components/:id') deleteComp(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteComponent(u.companyId, id); }

  @Get('structures') structures(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.listStructures(u.companyId, q); }
  @Get('structures/:id') structure(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.getStructure(u.companyId, id); }
  @Post('structures') @RequirePermission('salary.create') createStruct(@CurrentUser() u: any, @Body() dto: any) { return this.svc.createStructure(u.companyId, dto, u.sub); }
  @Post('structures/:id') updateStruct(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.svc.updateStructure(u.companyId, id, dto); }
  @Delete('structures/:id') deleteStruct(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.deleteStructure(u.companyId, id); }

  @Post('preview') preview(@Body() dto: any) { return this.svc.preview(dto); }

  @Get('employees/:id') empSalary(@Param('id', ParseUUIDPipe) id: string) { return this.svc.employeeSalary(id); }
  @Get('employees/:id/history') empHistory(@Param('id', ParseUUIDPipe) id: string) { return this.svc.employeeHistory(id); }
  @Post('employees/:id/assign') assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any, @CurrentUser() u: any) { return this.svc.assignSalary(id, dto, u.sub); }
}
