import { SaveOptions } from '../../../../common/types/save-options.type';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.value-object';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User, options?: SaveOptions): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
