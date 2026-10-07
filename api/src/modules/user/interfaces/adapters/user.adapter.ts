import { Inject, Injectable } from '@nestjs/common';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import { User, UserSnapshot } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UserAdapter {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async findByEmail(rawEmail: string): Promise<Result<UserSnapshot>> {
    const builder = new ResultBuilder<UserSnapshot>();

    const user = await this.users.findByEmail(Email.create(rawEmail));
    if (!user) {
      return builder.setSuccess(false).setMessage('User not found').build();
    }

    return builder.setSuccess(true).setDto(user.getSnapshot()).build();
  }

  async isEmailTaken(rawEmail: string): Promise<Result<boolean>> {
    const builder = new ResultBuilder<boolean>();

    const user = await this.users.findByEmail(Email.create(rawEmail));

    return builder
      .setSuccess(true)
      .setDto(user !== null)
      .build();
  }

  async create(
    rawEmail: string,
    passwordHash: string,
  ): Promise<Result<UserSnapshot>> {
    const builder = new ResultBuilder<UserSnapshot>();

    const email = Email.create(rawEmail);

    const user = User.create(email, passwordHash);

    await this.users.save(user, { flush: true });

    return builder.setSuccess(true).setDto(user.getSnapshot()).build();
  }
}
