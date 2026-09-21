import { Module } from '@nestjs/common';
import { SalaryComponentsController } from './components/salary-components.controller';
import { SalaryComponentsService } from './components/salary-components.service';
import { SalaryStructuresController } from './structures/salary-structures.controller';
import { SalaryStructuresService } from './structures/salary-structures.service';
import { EmployeeSalaryController } from './employee-salary/employee-salary.controller';
import { EmployeeSalaryService } from './employee-salary/employee-salary.service';
import { SalaryCalculationService } from './calculation/salary-calculation.service';

@Module({
  controllers: [
    SalaryComponentsController,
    SalaryStructuresController,
    EmployeeSalaryController,
  ],
  providers: [
    SalaryComponentsService,
    SalaryStructuresService,
    EmployeeSalaryService,
    SalaryCalculationService,
  ],
  exports: [
    SalaryComponentsService,
    SalaryStructuresService,
    EmployeeSalaryService,
    SalaryCalculationService,
  ],
})
export class SalaryModule {}
