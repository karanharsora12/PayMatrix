import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DocumentTypeService } from './document-type.service';
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from './dto/create-document-type.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('document-types')
@ApiBearerAuth('access-token')
@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly service: DocumentTypeService) {}

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

  @Get(':id/variables')
  @ApiOperation({ summary: 'Get available variables for document type' })
  getVariables(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getVariables(u.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create document type' })
  create(@CurrentUser() u: any, @Body() dto: CreateDocumentTypeDto) {
    return this.service.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document type' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    return this.service.update(u.companyId, id, dto, u.sub);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate document type' })
  activate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(u.companyId, id, u.sub);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate document type' })
  deactivate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(u.companyId, id, u.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete document type (only if no documents use it)' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(u.companyId, id, u.sub);
  }
}
