import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateEmailTemplateDto {
  @ApiProperty({ description: 'Unique Template Code', example: 'PAYSLIP_MONTHLY' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  templateCode: string;

  @ApiProperty({ description: 'Human-readable Template Name', example: 'Monthly Payslip Email' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  templateName: string;

  @ApiProperty({ description: 'Category/Module Type', example: 'Payslip' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  templateType: string;

  @ApiProperty({ description: 'Detailed template purpose/description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Email Subject with placeholders', example: 'Your Payslip for {{PayMonth}}' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Rich HTML Email Body with {{placeholders}}' })
  @IsNotEmpty()
  @IsString()
  bodyHtml: string;

  @ApiProperty({ description: 'Status of template', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ description: 'Whether this is the default active template for this type', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateEmailTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  templateCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  templateName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  templateType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ description: 'Optional note on why changes were made', required: false })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class DuplicateEmailTemplateDto {
  @ApiProperty({ description: 'New unique template code for the duplicate', example: 'PAYSLIP_MONTHLY_COPY' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  templateCode: string;

  @ApiProperty({ description: 'New template name for the duplicate', example: 'Monthly Payslip (Copy)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  templateName: string;
}

export class TestEmailDto {
  @ApiProperty({ description: 'Recipient email address to send test email to', example: 'admin@example.com', required: false })
  @IsOptional()
  @IsEmail()
  toEmail?: string;

  @ApiProperty({ description: 'Alias for toEmail', required: false, example: 'admin@example.com' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({ description: 'Subject (optional, uses template subject if not provided)', required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Body HTML (optional, uses template body if not provided)', required: false })
  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @ApiProperty({ description: 'Template Type', required: false })
  @IsOptional()
  @IsString()
  templateType?: string;
}

export class QueryEmailTemplateDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by template type', required: false })
  @IsOptional()
  @IsString()
  templateType?: string;

  @ApiProperty({ description: 'Filter by status', enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ description: 'Filter by default flag', required: false })
  @IsOptional()
  isDefault?: boolean | string;
}
