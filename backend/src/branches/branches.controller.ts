import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';

@ApiTags('branches')
@ApiBearerAuth('access-token')
@Controller('branches')
export class BranchesController {
  constructor(private svc: BranchesService) {}

  @Get()
  @RequirePermission('branches.view')
  list(@CurrentUser() user: any, @Query() q: PaginationDto) {
    return this.svc.list(user.companyId, q);
  }

  @Get(':id')
  get(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(user.companyId, id);
  }

  @Post()
  @RequirePermission('branches.create')
  create(@CurrentUser() user: any, @Body() dto: CreateBranchDto) {
    return this.svc.create(user.companyId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermission('branches.edit')
  update(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this.svc.update(user.companyId, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('branches.delete')
  remove(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(user.companyId, id);
  }
}
