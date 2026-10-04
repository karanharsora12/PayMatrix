import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentMasterService } from './document-master.service';
import { CreateDocumentMasterDto, UpdateDocumentMasterDto } from './dto/create-document-master.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('document-master')
@ApiBearerAuth('access-token')
@Controller('document-master')
export class DocumentMasterController {
  constructor(private readonly service: DocumentMasterService) {}

  @Get()
  @ApiOperation({ summary: 'List document types' })
  list(@CurrentUser() u: any, @Query() q: PaginationDto) {
    return this.service.list(u.companyId, Object.assign(new PaginationDto(), q));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document type by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(u.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new document type' })
  create(@CurrentUser() u: any, @Body() dto: CreateDocumentMasterDto) {
    return this.service.create(u.companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document type' })
  update(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentMasterDto) {
    return this.service.update(u.companyId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document type' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(u.companyId, id);
  }
}
