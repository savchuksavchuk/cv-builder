import { UserPayload } from '../../../../common/types/user-payload.type';

export interface SessionRepository {
  create(payload: UserPayload): string;
  get(sessionId: string): UserPayload | undefined;
  delete(sessionId: string): void;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
