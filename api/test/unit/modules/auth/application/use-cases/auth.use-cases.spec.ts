import { UnauthorizedException } from '@nestjs/common';
import {
  Result,
  ResultBuilder,
} from '../../../../../../src/common/classes/result.class';
import { PasswordHasher } from '../../../../../../src/modules/shared/services/password-hasher.service';
import { InMemorySessionRepository } from '../../../../../../src/modules/auth/infrastructure/repositories/in-memory-session.repository';
import {
  PortUser,
  UsersPort,
} from '../../../../../../src/modules/auth/application/ports/users.port';
import { SignInUseCase } from '../../../../../../src/modules/auth/application/use-cases/sign-in.use-case';
import { SignOutUseCase } from '../../../../../../src/modules/auth/application/use-cases/sign-out.use-case';
import { SignUpUseCase } from '../../../../../../src/modules/auth/application/use-cases/sign-up.use-case';

class FakeUsers implements UsersPort {
  private rows: { id: string; email: string; passwordHash: string }[] = [];

  findByEmail(email: string) {
    return Promise.resolve(
      this.result(this.rows.find((u) => u.email === email)),
    );
  }

  isEmailTaken(email: string) {
    const builder = new ResultBuilder<boolean>();
    const taken = this.rows.some((u) => u.email === email);
    return Promise.resolve(builder.setSuccess(true).setDto(taken).build());
  }

  create(email: string, passwordHash: string) {
    const row = { id: `id-${this.rows.length + 1}`, email, passwordHash };
    this.rows.push(row);
    return Promise.resolve(this.result(row));
  }

  private result(user?: PortUser): Result<PortUser> {
    const builder = new ResultBuilder<PortUser>();
    return user
      ? builder.setSuccess(true).setDto(user).build()
      : builder.setSuccess(false).setMessage('failed').build();
  }
}

describe('auth use-cases', () => {
  let sessions: InMemorySessionRepository;
  let signUp: SignUpUseCase;
  let signIn: SignInUseCase;
  let signOut: SignOutUseCase;

  beforeEach(() => {
    const users = new FakeUsers();
    sessions = new InMemorySessionRepository();
    const passwordHasher = new PasswordHasher();
    signUp = new SignUpUseCase(users, passwordHasher);
    signIn = new SignInUseCase(users, sessions, passwordHasher);
    signOut = new SignOutUseCase(sessions);
  });

  it('sign-up followed by sign-in creates a session with { sub }', async () => {
    await signUp.execute('a@b.com', 'password123');
    const sessionId = await signIn.execute('a@b.com', 'password123');
    expect(sessions.get(sessionId)).toEqual({ sub: 'id-1' });
  });

  it('wrong password and unknown email are rejected with 401', async () => {
    await signUp.execute('a@b.com', 'password123');
    await expect(signIn.execute('a@b.com', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(signIn.execute('x@b.com', 'password123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('repeated sign-up with the same email resolves silently and keeps the original user', async () => {
    await signUp.execute('a@b.com', 'password123');
    await expect(
      signUp.execute('a@b.com', 'another-password'),
    ).resolves.toBeUndefined();
    await expect(signIn.execute('a@b.com', 'password123')).resolves.toEqual(
      expect.any(String),
    );
    await expect(signIn.execute('a@b.com', 'another-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('sign-out removes the session', async () => {
    await signUp.execute('a@b.com', 'password123');
    const sessionId = await signIn.execute('a@b.com', 'password123');
    signOut.execute(sessionId);
    expect(sessions.get(sessionId)).toBeUndefined();
  });
});
