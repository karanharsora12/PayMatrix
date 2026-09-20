import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @IsString() @MaxLength(20) code: string;
  @IsString() @MaxLength(255) name: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateCompanyDto extends CreateCompanyDto {}
