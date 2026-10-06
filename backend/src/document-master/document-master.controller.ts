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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DocumentMasterService } from './document-master.service';
import {
  CreateDocumentMasterDto,
  UpdateDocumentMasterDto,
} from './dto/create-document-master.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('document-master')
@ApiBearerAuth('access-token')
@Controller('document-master')
export class DocumentMasterController {
  constructor(private readonly service: DocumentMasterService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get document master summary stats' })
  stats(@CurrentUser() u: any) {
    return this.service.stats(u.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'List document masters with filters' })
  @ApiQuery({ name: 'documentTypeId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'isRequired', required: false })
  @ApiQuery({ name: 'isRepeatable', required: false })
  list(@CurrentUser() u: any, @Query() q: any) {
    const dto = Object.assign(new PaginationDto(), q);
    return this.service.list(u.companyId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document master by ID' })
  get(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(u.companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create document master' })
  create(@CurrentUser() u: any, @Body() dto: CreateDocumentMasterDto) {
    return this.service.create(u.companyId, dto, u.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document master' })
  update(
    @CurrentUser() u: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentMasterDto,
  ) {
    return this.service.update(u.companyId, id, dto, u.sub);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate document master' })
  activate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(u.companyId, id, u.sub);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate document master' })
  deactivate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(u.companyId, id, u.sub);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate document master' })
  duplicate(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.duplicate(u.companyId, id, u.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete document master (blocked if assignments exist)' })
  remove(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(u.companyId, id, u.sub);
  }
}
