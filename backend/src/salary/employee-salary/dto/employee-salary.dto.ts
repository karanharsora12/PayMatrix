import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CalculationTypeEnum } from '../../components/dto/salary-component.dto';

export enum SalaryPolicyEnum {
  CALENDAR_DAYS = 'CALENDAR_DAYS',
  WORKING_DAYS = 'WORKING_DAYS',
  FIXED_MONTHLY = 'FIXED_MONTHLY',
}

export class EmployeeSalaryComponentOverrideDto {
  @IsOptional()
  id?: string;

  @IsUUID()
  salaryComponentId: string;

  @IsEnum(CalculationTypeEnum)
  calculationType: CalculationTypeEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  percentage?: number;

  @IsOptional()
  @IsString()
  percentageOf?: string;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  salaryComponent?: any;
}

export class AssignEmployeeSalaryDto {
  @IsUUID()
  salaryStructureId: string;

  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeSalaryComponentOverrideDto)
  components?: EmployeeSalaryComponentOverrideDto[];
}

export class CancelSalaryDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SalaryPreviewQueryDto {
  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM

  @IsOptional()
  @IsEnum(SalaryPolicyEnum)
  policy?: SalaryPolicyEnum;
}
