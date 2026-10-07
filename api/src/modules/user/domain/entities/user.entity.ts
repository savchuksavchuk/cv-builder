import { randomUUID } from 'node:crypto';
import { Email } from '../value-objects/email.value-object';

export type UserSnapshot = Readonly<{
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}>;

export class User {
  id!: string;
  email!: Email;
  passwordHash!: string;
  createdAt!: Date;

  static create(email: Email, passwordHash: string): User {
    const user = new User();
    user.id = randomUUID();
    user.email = email;
    user.passwordHash = passwordHash;
    user.createdAt = new Date();
    return user;
  }

  getSnapshot(): UserSnapshot {
    return Object.freeze({
      id: this.id,
      email: this.email.value,
      passwordHash: this.passwordHash,
      createdAt: new Date(this.createdAt),
    });
  }
}
