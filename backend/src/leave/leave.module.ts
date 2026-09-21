import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { WorkingDaysCalculationService } from './working-days-calculation.service';
import { LeaveBalanceService } from './leave-balance.service';

@Module({
  controllers: [LeaveController],
  providers: [LeaveService, WorkingDaysCalculationService, LeaveBalanceService],
  exports: [LeaveService, WorkingDaysCalculationService, LeaveBalanceService],
})
export class LeaveModule {}
