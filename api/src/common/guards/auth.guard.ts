import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserPayload } from '../types/user-payload.type';
import { SESSION_REPOSITORY } from '../../modules/auth/domain/repositories/session.repository';
import type { SessionRepository } from '../../modules/auth/domain/repositories/session.repository';

export const SESSION_COOKIE = 'sid';

export type AuthenticatedRequest = Request & {
  user: UserPayload;
  sessionId: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessions: SessionRepository,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = (req.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE
    ];
    const payload = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!sessionId || !payload) {
      throw new UnauthorizedException();
    }
    req.user = payload;
    req.sessionId = sessionId;
    return true;
  }
}
