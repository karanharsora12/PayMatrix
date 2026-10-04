import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertUserParameterDto {
  @ApiProperty({ description: 'Target Employee UUID', required: false })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ description: 'Target User UUID', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Parameter Name', example: 'CanManageAttendance' })
  @IsNotEmpty()
  @IsString()
  parameterName: string;

  @ApiProperty({ description: 'Parameter Value', example: true })
  @IsNotEmpty()
  parameterValue: boolean | string;
}

export class BatchItemDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Parameter Value' })
  @IsNotEmpty()
  parameterValue: boolean | string;
}

export class BatchUpsertUserParameterDto {
  @ApiProperty({ description: 'Parameter Name', example: 'CanManageAttendance' })
  @IsNotEmpty()
  @IsString()
  parameterName: string;

  @ApiProperty({ description: 'Items to update', type: [BatchItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];
}

export class QueryUserParameterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parameterName?: string;
}
