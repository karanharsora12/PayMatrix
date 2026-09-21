import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  WEEK_OFF = 'WEEK_OFF',
  ON_DUTY = 'ON_DUTY',
  WFH = 'WFH',
}

export enum PunchType {
  IN = 'IN',
  OUT = 'OUT',
  BREAK_IN = 'BREAK_IN',
  BREAK_OUT = 'BREAK_OUT',
}

export enum PunchSource {
  BIOMETRIC = 'BIOMETRIC',
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  MANUAL = 'MANUAL',
  API = 'API',
}

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-09-21', description: 'YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'attendanceDate must be YYYY-MM-DD' })
  attendanceDate: string;

  @ApiPropertyOptional({ example: '2026-09-21T09:30:00Z', description: 'ISO 8601 UTC timestamp' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-09-21T18:30:00Z', description: 'ISO 8601 UTC timestamp' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 480, description: 'Calculated or manual working minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  workingMinutes?: number;

  @ApiPropertyOptional({ example: 60, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  breakMinutes?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  overtimeMinutes?: number;

  @ApiPropertyOptional({ enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Regular on-time attendance' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '2026-09-21T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({ example: '2026-09-21T18:30:00Z' })
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  workingMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  breakMinutes?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  overtimeMinutes?: number;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Adjusted by HR' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateAttendancePunchDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-09-21T09:35:00Z', description: 'Punch ISO timestamp' })
  @IsDateString()
  @IsNotEmpty()
  punchTime: string;

  @ApiProperty({ enum: PunchType, example: PunchType.IN })
  @IsEnum(PunchType)
  @IsNotEmpty()
  punchType: PunchType;

  @ApiPropertyOptional({ enum: PunchSource, default: PunchSource.WEB })
  @IsOptional()
  @IsEnum(PunchSource)
  source?: PunchSource = PunchSource.WEB;

  @ApiPropertyOptional({ example: 'BIO-MAIN-GATE-01' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class AttendanceFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fromDate must be YYYY-MM-DD' })
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'toDate must be YYYY-MM-DD' })
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class AttendanceSummaryFilterDto {
  @ApiPropertyOptional({ example: '2026-09-21' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fromDate must be YYYY-MM-DD' })
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'toDate must be YYYY-MM-DD' })
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
