import { Result } from '../../../../common/classes/result.class';

export type PortUser = { id: string; email: string; passwordHash: string };

export interface UsersPort {
  findByEmail(email: string): Promise<Result<PortUser>>;
  isEmailTaken(email: string): Promise<Result<boolean>>;
  create(email: string, passwordHash: string): Promise<Result<PortUser>>;
}

export const USERS_PORT = Symbol('USERS_PORT');
