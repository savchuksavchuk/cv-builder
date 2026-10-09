import { randomUUID } from 'node:crypto';
import { Result, ResultBuilder } from '../../src/common/classes/result.class';
import { FileStoragePort } from '../../src/modules/cv/application/ports/file-storage.port';

export class InMemoryFileStorage implements FileStoragePort {
  private readonly files = new Map<string, Buffer>();

  save(content: Buffer): Promise<Result<string>> {
    const key = randomUUID();
    this.files.set(key, content);
    return Promise.resolve(
      new ResultBuilder<string>().setSuccess(true).setDto(key).build(),
    );
  }

  read(key: string): Promise<Result<Buffer>> {
    const content = this.files.get(key);
    const builder = new ResultBuilder<Buffer>();
    return Promise.resolve(
      content
        ? builder.setSuccess(true).setDto(content).build()
        : builder.setSuccess(false).setMessage('File not found').build(),
    );
  }

  delete(key: string): Promise<Result> {
    this.files.delete(key);
    return Promise.resolve(new ResultBuilder().setSuccess(true).build());
  }
}
