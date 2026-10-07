import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REPOSITORY } from '../../domain/repositories/session.repository';
import type { SessionRepository } from '../../domain/repositories/session.repository';

@Injectable()
export class SignOutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
  ) {}

  execute(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
