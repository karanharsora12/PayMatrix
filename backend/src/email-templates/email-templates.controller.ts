import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermission } from "../common/decorators/permissions.decorator";
import {
  CreateEmailTemplateDto,
  DuplicateEmailTemplateDto,
  QueryEmailTemplateDto,
  TestEmailDto,
  UpdateEmailTemplateDto,
} from "./dto/email-template.dto";
import { EmailTemplatesService } from "./email-templates.service";

@ApiTags("email-templates")
@ApiBearerAuth("access-token")
@Controller("email-templates")
export class EmailTemplatesController {
  constructor(private readonly service: EmailTemplatesService) {}

  @Get()
  @RequirePermission("settings.view")
  @ApiOperation({ summary: "List email templates with filters and pagination" })
  list(@CurrentUser() u: any, @Query() q: QueryEmailTemplateDto) {
    return this.service.list(
      u.companyId,
      Object.assign(new QueryEmailTemplateDto(), q),
      u.sub,
    );
  }

  @Get("variables")
  @RequirePermission("settings.view")
  @ApiOperation({
    summary:
      "Get available variable definitions, optionally filtered by templateType",
  })
  getVariables(@Query("templateType") templateType?: string) {
    return this.service.getVariables(templateType);
  }

  @Get("logs")
  @RequirePermission("settings.view")
  @ApiOperation({ summary: "List email transmission audit logs" })
  listLogs(@CurrentUser() u: any, @Query() q: any) {
    return this.service.listLogs(u.companyId, q);
  }

  @Post("test-email")
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Send test email using editor draft content" })
  sendAdHocTestEmail(@CurrentUser() u: any, @Body() dto: TestEmailDto) {
    return this.service.sendTestEmail(u.companyId, null, dto, u.sub);
  }

  @Get(":id")
  @RequirePermission("settings.view")
  @ApiOperation({ summary: "Get email template by ID with version history" })
  get(@CurrentUser() u: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.get(u.companyId, id);
  }

  @Post()
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Create a new email template" })
  create(@CurrentUser() u: any, @Body() dto: CreateEmailTemplateDto) {
    return this.service.create(u.companyId, dto, u.sub);
  }

  @Patch(":id")
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Update an existing email template" })
  update(
    @CurrentUser() u: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.service.update(u.companyId, id, dto, u.sub);
  }

  @Delete(":id")
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Delete an email template" })
  remove(@CurrentUser() u: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.remove(u.companyId, id, u.sub);
  }

  @Post(":id/duplicate")
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Duplicate an existing template" })
  duplicate(
    @CurrentUser() u: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DuplicateEmailTemplateDto,
  ) {
    return this.service.duplicate(u.companyId, id, dto, u.sub);
  }

  @Post(":id/toggle-status")
  @RequirePermission("settings.edit")
  @ApiOperation({
    summary: "Toggle template status between ACTIVE and INACTIVE",
  })
  toggleStatus(@CurrentUser() u: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.toggleStatus(u.companyId, id, u.sub);
  }

  @Post(":id/set-default")
  @RequirePermission("settings.edit")
  @ApiOperation({
    summary: "Set template as default active for its templateType",
  })
  setDefault(@CurrentUser() u: any, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.setDefault(u.companyId, id, u.sub);
  }

  @Post(":id/test-email")
  @RequirePermission("settings.edit")
  @ApiOperation({ summary: "Send test email using saved template" })
  sendSavedTestEmail(
    @CurrentUser() u: any,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TestEmailDto,
  ) {
    return this.service.sendTestEmail(u.companyId, id, dto, u.sub);
  }
}
