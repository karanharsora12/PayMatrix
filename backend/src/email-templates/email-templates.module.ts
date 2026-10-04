import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailTemplatesController } from './email-templates.controller';
import { EmailTemplatesService } from './email-templates.service';
import { EmailSenderService } from './email-sender.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, EmailSenderService],
  exports: [EmailTemplatesService, EmailSenderService],
})
export class EmailTemplatesModule {}
