import { Module } from '@nestjs/common';
import { PaidDaysCalculationService } from './calculation/paid-days-calculation.service';
import { PayrollCalculationService } from './calculation/payroll-calculation.service';
import { PayrollAdjustmentsService } from './adjustments/payroll-adjustments.service';
import { PayslipsService } from './payslips/payslips.service';
import { PayrollRunsService } from './runs/payroll-runs.service';
import { PayrollRunsController } from './runs/payroll-runs.controller';
import { PayslipsController } from './payslips/payslips.controller';
import { PayrollGateway } from './payroll.gateway';

// Re-export for compatibility
export { PayrollRunsService as PayrollService } from './runs/payroll-runs.service';
export { PayrollCalculationService } from './calculation/payroll-calculation.service';
export { PaidDaysCalculationService } from './calculation/paid-days-calculation.service';
export { PayslipsService } from './payslips/payslips.service';

@Module({
  controllers: [PayrollRunsController, PayslipsController],
  providers: [
    PaidDaysCalculationService,
    PayrollCalculationService,
    PayrollRunsService,
    PayrollAdjustmentsService,
    PayslipsService,
    PayrollGateway,
  ],
  exports: [
    PaidDaysCalculationService,
    PayrollCalculationService,
    PayrollRunsService,
    PayslipsService,
  ],
})
export class PayrollModule {}
