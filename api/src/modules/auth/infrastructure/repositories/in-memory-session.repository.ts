import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { UserPayload } from '../../../../common/types/user-payload.type';
import { SessionRepository } from '../../domain/repositories/session.repository';

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, UserPayload>();

  create(payload: UserPayload): string {
    const id = randomBytes(32).toString('hex');
    this.sessions.set(id, payload);
    return id;
  }

  get(sessionId: string): UserPayload | undefined {
    return this.sessions.get(sessionId);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
