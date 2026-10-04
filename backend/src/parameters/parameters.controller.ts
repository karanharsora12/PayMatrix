import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParametersService } from './parameters.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  QueryUserParameterDto,
  UpsertUserParameterDto,
} from './dto/user-parameter.dto';

@ApiTags('user-parameters')
@ApiBearerAuth('access-token')
@Controller('user-parameters')
export class ParametersController {
  constructor(private readonly svc: ParametersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get resolved parameters for logged in user' })
  async getMyParameters(@CurrentUser() u: any) {
    const params = await this.svc.getUserParameters(
      u.companyId,
      u.sub,
      u.employeeId,
    );
    return {
      success: true,
      data: params,
    };
  }

  @Get('definitions')
  @ApiOperation({ summary: 'Get list of supported parameter definitions' })
  getDefinitions() {
    return this.svc.getDefinitions();
  }

  @Get()
  @ApiOperation({ summary: 'List user wise parameters for all employees' })
  listUserWise(
    @CurrentUser() u: any,
    @Query() query: QueryUserParameterDto,
  ) {
    return this.svc.listUserWiseParameters(u.companyId, query);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: 'Get parameters for a specific employee' })
  getEmployeeParameters(
    @CurrentUser() u: any,
    @Param('employeeId', ParseUUIDPipe) empId: string,
  ) {
    return this.svc.getEmployeeParameters(u.companyId, empId);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch save or update parameters for multiple employees' })
  batchUpsert(
    @CurrentUser() u: any,
    @Body() dto: any,
  ) {
    return this.svc.batchUpsert(u.companyId, dto, u.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Save or update a user wise parameter' })
  upsert(
    @CurrentUser() u: any,
    @Body() dto: UpsertUserParameterDto,
  ) {
    return this.svc.upsert(u.companyId, dto, u.sub);
  }
}
