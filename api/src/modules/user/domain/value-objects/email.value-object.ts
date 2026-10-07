export class Email {
  private constructor(private readonly value: string) {}

  static create(raw: string): Email {
    return new Email(raw.trim().toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
