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
import { SalaryStructuresService } from './salary-structures.service';
import {
  CreateSalaryStructureDto,
  FilterSalaryStructureDto,
  PreviewStructureDto,
  StructureComponentInputDto,
  UpdateSalaryStructureDto,
} from './dto/salary-structure.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('salary-structures')
@ApiBearerAuth('access-token')
@Controller('salary/structures')
export class SalaryStructuresController {
  constructor(private readonly service: SalaryStructuresService) {}

  @Get()
  @RequirePermission('salary.structure.view')
  @ApiOperation({ summary: 'List salary structures' })
  list(@CurrentUser() user: any, @Query() query: FilterSalaryStructureDto) {
    return this.service.list(user.companyId, query);
  }

  @Post('preview')
  @RequirePermission('salary.structure.view')
  @ApiOperation({ summary: 'Preview structure calculation breakdown in real-time' })
  preview(@CurrentUser() user: any, @Body() dto: PreviewStructureDto) {
    return this.service.preview(user.companyId, dto);
  }

  @Get(':id')
  @RequirePermission('salary.structure.view')
  @ApiOperation({ summary: 'Get salary structure by ID with all components' })
  getById(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(user.companyId, id);
  }

  @Post()
  @RequirePermission('salary.structure.create')
  @ApiOperation({ summary: 'Create salary structure with components' })
  create(@CurrentUser() user: any, @Body() dto: CreateSalaryStructureDto) {
    return this.service.create(user.companyId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermission('salary.structure.edit')
  @ApiOperation({ summary: 'Update salary structure and components' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalaryStructureDto,
  ) {
    return this.service.update(user.companyId, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('salary.structure.delete')
  @ApiOperation({ summary: 'Delete salary structure' })
  delete(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(user.companyId, id, user.sub);
  }

  // Nested structure component endpoints
  @Get(':id/components')
  @RequirePermission('salary.structure.view')
  @ApiOperation({ summary: 'List components of a salary structure' })
  listComponents(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.listComponents(user.companyId, id);
  }

  @Post(':id/components')
  @RequirePermission('salary.structure.edit')
  @ApiOperation({ summary: 'Add a component to a salary structure' })
  addComponent(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StructureComponentInputDto,
  ) {
    return this.service.addComponent(user.companyId, id, dto, user.sub);
  }

  @Patch(':id/components/:componentId')
  @RequirePermission('salary.structure.edit')
  @ApiOperation({ summary: 'Update a specific component within a salary structure' })
  updateComponent(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('componentId', ParseUUIDPipe) componentId: string,
    @Body() dto: Partial<StructureComponentInputDto>,
  ) {
    return this.service.updateComponent(user.companyId, id, componentId, dto);
  }

  @Delete(':id/components/:componentId')
  @RequirePermission('salary.structure.edit')
  @ApiOperation({ summary: 'Remove a component from a salary structure' })
  removeComponent(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('componentId', ParseUUIDPipe) componentId: string,
  ) {
    return this.service.removeComponent(user.companyId, id, componentId);
  }
}
