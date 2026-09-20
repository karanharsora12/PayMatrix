import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

export interface JwtPayload {
  sub: string; // userId
  companyId: string | null;
  email: string;
  roles: string[];
  permissions: string[];
}
