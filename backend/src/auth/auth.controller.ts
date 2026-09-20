import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, ChangePasswordDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.auth.login(dto.email, dto.password);
    return { success: true, data, message: 'Login successful' };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const data = await this.auth.refresh(dto.refreshToken);
    return { success: true, data, message: 'Token refreshed' };
  }

  @Post('logout')
  async logout() {
    return { success: true, data: null, message: 'Logged out' };
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  async me(@CurrentUser() user: any) {
    const data = await this.auth.me(user.sub);
    return { success: true, data, message: 'Profile fetched' };
  }

  @ApiBearerAuth('access-token')
  @Post('change-password')
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    const data = await this.auth.changePassword(user.sub, dto.oldPassword, dto.newPassword);
    return { success: true, data, message: 'Password changed' };
  }
}
