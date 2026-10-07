export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    return new Email(raw.trim().toLowerCase());
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
