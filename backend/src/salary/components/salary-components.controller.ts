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
import { SalaryComponentsService } from './salary-components.service';
import {
  CreateSalaryComponentDto,
  FilterSalaryComponentDto,
  UpdateSalaryComponentDto,
} from './dto/salary-component.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';

@ApiTags('salary-components')
@ApiBearerAuth('access-token')
@Controller('salary/components')
export class SalaryComponentsController {
  constructor(private readonly service: SalaryComponentsService) {}

  @Get()
  @RequirePermission('salary.component.view')
  @ApiOperation({ summary: 'List salary components with search, filtering and pagination' })
  list(@CurrentUser() user: any, @Query() query: FilterSalaryComponentDto) {
    return this.service.list(user.companyId, query);
  }

  @Get(':id')
  @RequirePermission('salary.component.view')
  @ApiOperation({ summary: 'Get salary component by ID' })
  getById(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(user.companyId, id);
  }

  @Post()
  @RequirePermission('salary.component.create')
  @ApiOperation({ summary: 'Create a new salary component' })
  create(@CurrentUser() user: any, @Body() dto: CreateSalaryComponentDto) {
    return this.service.create(user.companyId, dto, user.sub);
  }

  @Patch(':id')
  @RequirePermission('salary.component.edit')
  @ApiOperation({ summary: 'Update salary component' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalaryComponentDto,
  ) {
    return this.service.update(user.companyId, id, dto, user.sub);
  }

  @Delete(':id')
  @RequirePermission('salary.component.delete')
  @ApiOperation({ summary: 'Delete salary component (if not referenced in structures)' })
  delete(@CurrentUser() user: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(user.companyId, id, user.sub);
  }
}
