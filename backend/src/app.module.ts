import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { EmployeesModule } from './employees/employees.module';
import { ShiftsModule } from './shifts/shifts.module';
import { HolidaysModule } from './holidays/holidays.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { SalaryModule } from './salary/salary.module';
import { PayrollModule } from './payroll/payroll.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { DeductionsModule } from './deductions/deductions.module';
import { LoansModule } from './loans/loans.module';
import { AdvancesModule } from './advances/advances.module';
import { StatutoryModule } from './statutory/statutory.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env', 'backend/.env'] }),
    DatabaseModule,
    AuthModule,
    CompaniesModule,
    BranchesModule,
    DepartmentsModule,
    DesignationsModule,
    EmployeesModule,
    ShiftsModule,
    HolidaysModule,
    AttendanceModule,
    LeaveModule,
    SalaryModule,
    PayrollModule,
    BonusesModule,
    DeductionsModule,
    LoansModule,
    AdvancesModule,
    StatutoryModule,
    ReportsModule,
    DashboardModule,
    UsersModule,
    RolesModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
