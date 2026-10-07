import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SESSION_REPOSITORY } from '../../domain/repositories/session.repository';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import { PasswordHasher } from '../../../shared/services/password-hasher.service';
import { USERS_PORT } from '../ports/users.port';
import type { UsersPort } from '../ports/users.port';

@Injectable()
export class SignInUseCase {
  private readonly dummyHash: Promise<string>;

  constructor(
    @Inject(USERS_PORT) private readonly users: UsersPort,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    this.dummyHash = this.passwordHasher.hash('dummy-password');
  }

  async execute(email: string, password: string): Promise<string> {
    const user = (await this.users.findByEmail(email)).dto;
    const valid = await this.passwordHasher.verify(
      password,
      user?.passwordHash ?? (await this.dummyHash),
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.sessions.create({ sub: user.id });
  }
}
