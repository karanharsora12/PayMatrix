import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @ApiPropertyOptional({ enum: ['CURRENT', 'PERMANENT', 'EMERGENCY'] })
  @IsOptional() @IsString() addressType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine1?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() addressLine2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
}

export class CreateBankAccountDto {
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ifscCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountHolderName?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) isPrimary?: boolean;
}

export class UpdateStatutoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() panNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nationalIdNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pfNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() esiNumber?: string;
}

export class CreateDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() documentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
}
