import { EntitySchema } from '@mikro-orm/core';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';

export interface UserModel {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export class UserSchema extends EntitySchema<UserModel> {
  constructor() {
    super({
      name: 'UserModel',
      tableName: 'users',
      properties: {
        id: { type: 'uuid', primary: true },
        email: { type: 'string', unique: true },
        passwordHash: { type: 'string' },
        createdAt: { type: 'Date' },
      },
    });
  }

  fromDomain(user: User): UserModel {
    return { ...user.getSnapshot() };
  }

  toDomain(model: UserModel): User {
    const user = new User();
    user.id = model.id;
    user.email = Email.create(model.email);
    user.passwordHash = model.passwordHash;
    user.createdAt = model.createdAt;
    return user;
  }
}

export const userSchema = new UserSchema();
