import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum HolidayType {
  NATIONAL = 'NATIONAL',
  FESTIVAL = 'FESTIVAL',
  WEEKLY_OFF = 'WEEKLY_OFF',
  RESTRICTED = 'RESTRICTED',
}

export class CreateHolidayDto {
  @ApiProperty({ example: 'Republic Day' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-01-26', description: 'YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'holidayDate must be YYYY-MM-DD' })
  holidayDate: string;

  @ApiPropertyOptional({ enum: HolidayType, default: HolidayType.NATIONAL })
  @IsOptional()
  @IsEnum(HolidayType)
  holidayType?: HolidayType = HolidayType.NATIONAL;

  @ApiPropertyOptional({ example: 'Celebration of Constitution of India' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean = false;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ example: 'Republic Day' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '2026-01-26' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'holidayDate must be YYYY-MM-DD' })
  holidayDate?: string;

  @ApiPropertyOptional({ enum: HolidayType })
  @IsOptional()
  @IsEnum(HolidayType)
  holidayType?: HolidayType;

  @ApiPropertyOptional({ example: 'Celebration of Constitution' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class HolidayFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 2026, description: 'Filter by year (YYYY)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ example: 9, description: 'Filter by month (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ enum: HolidayType })
  @IsOptional()
  @IsEnum(HolidayType)
  holidayType?: HolidayType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOptional?: boolean;
}
