import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  IsUUID,
  ValidateNested,
  IsIn,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DocumentFieldDto {
  @ApiProperty({ example: 'Employee Name' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'EmployeeName' })
  @IsString()
  variable: string;

  @ApiPropertyOptional({ example: 'Text', enum: ['Text', 'Date', 'Number', 'Currency'] })
  @IsOptional()
  @IsString()
  @IsIn(['Text', 'Date', 'Number', 'Currency'])
  type?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class CreateDocumentMasterDto {
  @ApiProperty({ example: 'JOINING_LETTER' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Joining Letter' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRepeatable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [DocumentFieldDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentFieldDto)
  fields?: DocumentFieldDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateContent?: string;
}

export class UpdateDocumentMasterDto extends PartialType(CreateDocumentMasterDto) {}
