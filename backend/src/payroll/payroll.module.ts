import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { PayrollGateway } from './payroll.gateway';
@Module({ controllers: [PayrollController], providers: [PayrollService, PayrollCalculationService, PayrollGateway], exports: [PayrollService] })
export class PayrollModule {}
