import { Module } from '@nestjs/common';
import { PaidDaysCalculationService } from './calculation/paid-days-calculation.service';
import { PayrollCalculationService } from './calculation/payroll-calculation.service';
import { PayrollAdjustmentsService } from './adjustments/payroll-adjustments.service';
import { PayslipsService } from './payslips/payslips.service';
import { PayrollRunsService } from './runs/payroll-runs.service';
import { PayrollRunsController } from './runs/payroll-runs.controller';
import { PayslipsController } from './payslips/payslips.controller';
import { PayrollGateway } from './payroll.gateway';

import { EmailTemplatesModule } from '../email-templates/email-templates.module';

import { PayslipPdfService } from './payslips/payslip-pdf.service';

// Re-export for compatibility
export { PayrollRunsService as PayrollService } from './runs/payroll-runs.service';
export { PayrollCalculationService } from './calculation/payroll-calculation.service';
export { PaidDaysCalculationService } from './calculation/paid-days-calculation.service';
export { PayslipsService } from './payslips/payslips.service';
export { PayslipPdfService } from './payslips/payslip-pdf.service';

@Module({
  imports: [EmailTemplatesModule],
  controllers: [PayrollRunsController, PayslipsController],
  providers: [
    PaidDaysCalculationService,
    PayrollCalculationService,
    PayrollRunsService,
    PayrollAdjustmentsService,
    PayslipsService,
    PayslipPdfService,
    PayrollGateway,
  ],
  exports: [
    PaidDaysCalculationService,
    PayrollCalculationService,
    PayrollRunsService,
    PayslipsService,
    PayslipPdfService,
  ],
})
export class PayrollModule {}
