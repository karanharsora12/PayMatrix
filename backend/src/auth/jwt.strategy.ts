import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }
  async validate(payload: any) {
    if (!payload?.sub) throw new UnauthorizedException('Invalid token');
    return {
      sub: payload.sub,
      companyId: payload.companyId ?? null,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      employeeId: payload.employeeId ?? null,
    };
  }
}
