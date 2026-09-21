import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePayrollRunDto {
  @ApiProperty({ example: 2026, description: 'Payroll period year' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  year: number;

  @ApiProperty({ example: 9, description: 'Payroll period month (1-12)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Expected disbursement / pay date' })
  @IsOptional()
  @IsString()
  payDate?: string;

  @ApiPropertyOptional({
    enum: ['CALENDAR_DAYS', 'WORKING_DAYS', 'FIXED_MONTHLY'],
    default: 'CALENDAR_DAYS',
    description: 'Proration policy to apply for this payroll period',
  })
  @IsOptional()
  @IsEnum(['CALENDAR_DAYS', 'WORKING_DAYS', 'FIXED_MONTHLY'])
  policy?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY';
}

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PayrollRunFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number;

  @ApiPropertyOptional({ example: 'CALCULATED' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ApprovePayrollRunDto {
  @ApiPropertyOptional({ example: 'Verified attendance and salary structures for September 2026.' })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class PayrollAdjustmentDto {
  @ApiProperty({ enum: ['ARREAR', 'BONUS', 'RECOVERY', 'OTHER_EARNING', 'OTHER_DEDUCTION'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Performance Bonus' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  isAddition?: boolean;

  @ApiProperty({ example: 'Approved by department head for Q3 project delivery' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ example: 'Optional additional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
