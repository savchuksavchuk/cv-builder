export interface Result<T = void> {
  success: boolean;
  message?: string;
  dto?: T;
}

export class ResultBuilder<T = void> {
  private result: Result<T> = { success: false };

  setSuccess(success: boolean): this {
    this.result.success = success;

    return this;
  }

  setMessage(message: string): this {
    this.result.message = message;

    return this;
  }

  setDto(dto: T): this {
    this.result.dto = dto;

    return this;
  }

  build(): Result<T> {
    return this.result;
  }
}
