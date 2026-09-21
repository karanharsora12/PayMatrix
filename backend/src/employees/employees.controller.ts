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
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from './dto/create-employee.dto';
import {
  CreateAddressDto,
  CreateBankAccountDto,
  UpdateStatutoryDto,
  CreateDocumentDto,
} from './dto/employee-subresource.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { ShiftsService } from '../shifts/shifts.service';
import { AttendanceService } from '../attendance/attendance.service';
import { LeaveService } from '../leave/leave.service';
import { AssignShiftDto } from '../shifts/dto/shift.dto';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly svc: EmployeesService,
    private readonly shiftsSvc: ShiftsService,
    private readonly attendanceSvc: AttendanceService,
    private readonly leaveSvc: LeaveService,
  ) {}

  @Get()
  @RequirePermission('employees.view')
  @ApiOperation({ summary: 'List employees with filters and pagination' })
  list(@CurrentUser() u: any, @Query() q: PaginationDto & any) {
    const { page, pageSize, search, sortBy, sortOrder, ...filters } = q;
    const pagination = Object.assign(new PaginationDto(), {
      page: Number(page ?? 1),
      pageSize: Number(pageSize ?? 20),
      search,
      sortBy,
      sortOrder,
    });
    return this.svc.list(u.companyId, filters, pagination);
  }

  @Get(':id')
  @RequirePermission('employees.view')
  @ApiOperation({ summary: 'Get employee by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u.companyId, id);
  }

  @Get(':id/profile')
  @RequirePermission('employees.view')
  @ApiOperation({ summary: 'Get aggregated employee profile' })
  profile(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.profile(u.companyId, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get employee audit history' })
  history(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.history(u.companyId, id);
  }

  @Post()
  @RequirePermission('employees.create')
  @ApiOperation({ summary: 'Create new employee' })
  create(@CurrentUser() u: any, @Body() dto: CreateEmployeeDto) {
    return this.svc.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @RequirePermission('employees.edit')
  @ApiOperation({ summary: 'Update employee (partial)' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.svc.update(u.companyId, id, dto, u.sub);
  }

  @Delete(':id')
  @RequirePermission('employees.delete')
  @ApiOperation({ summary: 'Soft-delete employee' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u.companyId, id, u.sub);
  }

  // ── Addresses ────────────────────────────────────────────────────────────────
  @Get(':id/addresses')
  @ApiOperation({ summary: 'List employee addresses' })
  listAddresses(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.listAddresses(u.companyId, id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add address to employee' })
  createAddress(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.svc.createAddress(u.companyId, id, dto, u.sub);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Delete address' })
  deleteAddress(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.svc.deleteAddress(u.companyId, id, addressId, u.sub);
  }

  // ── Bank Accounts ────────────────────────────────────────────────────────────
  @Get(':id/bank-accounts')
  @ApiOperation({ summary: 'List employee bank accounts' })
  listBankAccounts(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.svc.listBankAccounts(u.companyId, id);
  }

  @Post(':id/bank-accounts')
  @ApiOperation({ summary: 'Add bank account' })
  createBankAccount(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.svc.createBankAccount(u.companyId, id, dto, u.sub);
  }

  @Delete(':id/bank-accounts/:accountId')
  @ApiOperation({ summary: 'Delete bank account' })
  deleteBankAccount(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ) {
    return this.svc.deleteBankAccount(u.companyId, id, accountId, u.sub);
  }

  // ── Statutory ────────────────────────────────────────────────────────────────
  @Get(':id/statutory')
  @ApiOperation({ summary: 'Get statutory details' })
  getStatutory(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getStatutory(u.companyId, id);
  }

  @Patch(':id/statutory')
  @ApiOperation({ summary: 'Update statutory details' })
  updateStatutory(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatutoryDto,
  ) {
    return this.svc.updateStatutory(u.companyId, id, dto, u.sub);
  }

  // ── Documents ────────────────────────────────────────────────────────────────
  @Get(':id/documents')
  @ApiOperation({ summary: 'List employee documents' })
  listDocuments(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.listDocuments(u.companyId, id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Add document metadata' })
  createDocument(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.svc.createDocument(u.companyId, id, dto, u.sub);
  }

  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Delete document' })
  deleteDocument(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.svc.deleteDocument(u.companyId, id, documentId, u.sub);
  }

  // ── Shifts (Phase 5) ─────────────────────────────────────────────────────────
  @Post(':id/shifts')
  @RequirePermission('shift.edit')
  @ApiOperation({ summary: 'Assign shift to employee' })
  assignShift(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Body() dto: AssignShiftDto,
  ) {
    return this.shiftsSvc.assign(u.companyId, empId, dto, u.sub);
  }

  @Get(':id/shifts')
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'Get employee shift assignment history' })
  getShifts(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
  ) {
    return this.shiftsSvc.assignments(u.companyId, empId);
  }

  @Get(':id/shifts/current')
  @RequirePermission('shift.view')
  @ApiOperation({ summary: 'Get employee current effective shift' })
  getCurrentShift(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('onDate') onDate?: string,
  ) {
    return this.shiftsSvc.getCurrentShift(u.companyId, empId, onDate);
  }

  // ── Attendance (Phase 5) ─────────────────────────────────────────────────────
  @Get(':id/attendance')
  @RequirePermission('attendance.view')
  @ApiOperation({ summary: 'Get employee attendance history' })
  getAttendance(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    return this.attendanceSvc.getEmployeeAttendance(u.companyId, empId, {
      fromDate,
      toDate,
      status,
    });
  }

  // ── Leave Balances (Phase 5) ─────────────────────────────────────────────────
  @Get(':id/leave-balances')
  @RequirePermission('leave.view')
  @ApiOperation({ summary: 'Get employee leave balances' })
  getLeaveBalances(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) empId: string,
    @Query('year') year?: number,
  ) {
    return this.leaveSvc.balances(u.companyId, empId, year ? Number(year) : undefined);
  }
}
