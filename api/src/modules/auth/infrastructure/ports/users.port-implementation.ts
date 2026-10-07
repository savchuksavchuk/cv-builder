import { Injectable } from '@nestjs/common';
import { UserAdapter } from '../../../user/interfaces/adapters/user.adapter';
import { UsersPort } from '../../application/ports/users.port';

@Injectable()
export class UsersPortImplementation implements UsersPort {
  constructor(private readonly userAdapter: UserAdapter) {}

  findByEmail(email: string) {
    return this.userAdapter.findByEmail(email);
  }

  isEmailTaken(email: string) {
    return this.userAdapter.isEmailTaken(email);
  }

  create(email: string, passwordHash: string) {
    return this.userAdapter.create(email, passwordHash);
  }
}
