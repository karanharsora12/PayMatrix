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
import { ShiftsService } from './shifts.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { AssignShiftDto, CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@ApiTags('shifts')
@ApiBearerAuth('access-token')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly svc: ShiftsService) {}

  @Get()
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'List shifts with pagination' })
  list(@CurrentUser() u: any, @Query() q: PaginationDto) {
    return this.svc.list(u.companyId, q);
  }

  @Get(':id')
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'Get shift by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u.companyId, id);
  }

  @Post()
  @RequirePermission('shift.create')
  @ApiOperation({ summary: 'Create a new shift' })
  create(@CurrentUser() u: any, @Body() dto: CreateShiftDto) {
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('shift.edit')
  @ApiOperation({ summary: 'Update an existing shift' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.svc.update(u.companyId, id, dto, u.sub);
  }

  @Delete(':id')
  @RequirePermission('shift.delete')
  @ApiOperation({ summary: 'Delete a shift' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u.companyId, id, u.sub);
  }

  @Post('employees/:employeeId/assign')
  @RequirePermission('shift.edit')
  @ApiOperation({ summary: 'Assign a shift to an employee' })
  assign(
    @CurrentUser() u: any,
    @Param('employeeId', ParseUUIDPipe) empId: string,
    @Body() dto: AssignShiftDto,
  ) {
    return this.svc.assign(u.companyId, empId, dto, u.sub);
  }

  @Get('employees/:employeeId/assignments')
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'Get shift assignment history for an employee' })
  assignments(
    @CurrentUser() u: any,
    @Param('employeeId', ParseUUIDPipe) empId: string,
  ) {
    return this.svc.assignments(u.companyId, empId);
  }

  @Get('employees/:employeeId/current')
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'Get current effective shift for an employee' })
  getCurrent(
    @CurrentUser() u: any,
    @Param('employeeId', ParseUUIDPipe) empId: string,
    @Query('onDate') onDate?: string,
  ) {
    return this.svc.getCurrentShift(u.companyId, empId, onDate);
  }
}
