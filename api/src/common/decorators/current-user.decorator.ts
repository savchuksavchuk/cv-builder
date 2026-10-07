import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserPayload } from '../types/user-payload.type';
import type { AuthenticatedRequest } from '../guards/auth.guard';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserPayload =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
