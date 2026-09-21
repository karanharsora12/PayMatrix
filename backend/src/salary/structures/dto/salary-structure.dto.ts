import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { CalculationTypeEnum } from '../../components/dto/salary-component.dto';

export class StructureComponentInputDto {
  @IsOptional()
  id?: string;

  @IsOptional()
  salaryStructureId?: string;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maximumAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  updatedAt?: any;

  @IsOptional()
  salaryComponent?: any;
}

export class CreateSalaryStructureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StructureComponentInputDto)
  components?: StructureComponentInputDto[];
}

export class UpdateSalaryStructureDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StructureComponentInputDto)
  components?: StructureComponentInputDto[];
}

export class PreviewStructureDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StructureComponentInputDto)
  components: StructureComponentInputDto[];
}

export class FilterSalaryStructureDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
