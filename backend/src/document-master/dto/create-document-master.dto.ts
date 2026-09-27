import { IsBoolean, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentMasterDto {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateContent?: string;
}

export class UpdateDocumentMasterDto extends CreateDocumentMasterDto {}
