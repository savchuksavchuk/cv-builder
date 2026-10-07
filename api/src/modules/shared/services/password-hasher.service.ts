import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LEN = 64;

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await this.derive(password, salt);

    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    const expected = Buffer.from(hash, 'hex');
    const actual = await this.derive(password, Buffer.from(salt, 'hex'));

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  private derive(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) =>
      scrypt(password, salt, KEY_LEN, (err, key) =>
        err ? reject(err) : resolve(key),
      ),
    );
  }
}
