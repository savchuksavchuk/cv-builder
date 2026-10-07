import { Email } from './email.value-object';

describe('Email', () => {
  it('trims surrounding whitespace', () => {
    expect(Email.create('  a@b.com  ').value).toBe('a@b.com');
  });

  it('lowercases the value', () => {
    expect(Email.create('A@B.Com').value).toBe('a@b.com');
  });

  it('is equal to another email with the same normalized value', () => {
    expect(Email.create(' A@b.com').equals(Email.create('a@B.COM '))).toBe(
      true,
    );
  });

  it('is not equal to an email with a different value', () => {
    expect(Email.create('a@b.com').equals(Email.create('c@b.com'))).toBe(false);
  });
});
