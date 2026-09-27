import { Module } from '@nestjs/common';
import { EmployeeGroupsService } from './employee-groups.service';
import { EmployeeGroupsController } from './employee-groups.controller';

@Module({
  controllers: [EmployeeGroupsController],
  providers: [EmployeeGroupsService],
  exports: [EmployeeGroupsService],
})
export class EmployeeGroupsModule {}
