import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() list(@CurrentUser() u: any, @Query() q: PaginationDto) { return this.svc.list(u.sub, q); }
  @Patch(':id/read') read(@CurrentUser() u: any, @Param('id', ParseUUIDPipe) id: string) { return this.svc.markRead(u.sub, id); }
  @Get('preferences/all') prefs(@CurrentUser() u: any) { return this.svc.preferences(u.sub); }
  @Post('preferences') upsert(@CurrentUser() u: any, @Body() dto: any) { return this.svc.upsertPreference(u.sub, dto); }
}
