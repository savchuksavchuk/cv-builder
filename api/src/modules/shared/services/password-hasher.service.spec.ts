import { PasswordHasher } from './password-hasher.service';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('does not store the password in plain text', async () => {
    const hash = await hasher.hash('password123');

    expect(hash).not.toContain('password123');
  });

  it('verifies the correct password', async () => {
    const hash = await hasher.hash('password123');

    await expect(hasher.verify('password123', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash('password123');

    await expect(hasher.verify('wrong-password', hash)).resolves.toBe(false);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const first = await hasher.hash('password123');
    const second = await hasher.hash('password123');

    expect(first).not.toBe(second);
  });
});
