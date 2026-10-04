import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceCalculationService } from './attendance-calculation.service';
import { ParametersModule } from '../parameters/parameters.module';

@Module({
  imports: [ParametersModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCalculationService],
  exports: [AttendanceService, AttendanceCalculationService],
})
export class AttendanceModule {}
