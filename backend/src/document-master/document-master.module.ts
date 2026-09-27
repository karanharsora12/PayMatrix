import { Module } from '@nestjs/common';
import { DocumentMasterService } from './document-master.service';
import { DocumentMasterController } from './document-master.controller';

@Module({
  controllers: [DocumentMasterController],
  providers: [DocumentMasterService],
  exports: [DocumentMasterService],
})
export class DocumentMasterModule {}
