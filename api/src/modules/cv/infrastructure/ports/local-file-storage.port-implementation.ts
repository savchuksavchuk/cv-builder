import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Result, ResultBuilder } from '../../../../common/classes/result.class';
import { FileStoragePort } from '../../application/ports/file-storage.port';

const STORAGE_DIR = join(process.cwd(), 'storage', 'cv-sources');
const KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

@Injectable()
export class LocalFileStoragePortImplementation implements FileStoragePort {
  private readonly logger = new Logger(LocalFileStoragePortImplementation.name);

  async save(content: Buffer): Promise<Result<string>> {
    const builder = new ResultBuilder<string>();
    const key = randomUUID();

    try {
      await mkdir(STORAGE_DIR, { recursive: true });
      await writeFile(join(STORAGE_DIR, key), content);
      return builder.setSuccess(true).setDto(key).build();
    } catch (error) {
      this.logger.error(`Failed to save file: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('Could not save file')
        .build();
    }
  }

  async read(key: string): Promise<Result<Buffer>> {
    const builder = new ResultBuilder<Buffer>();

    if (!KEY_PATTERN.test(key)) {
      return builder.setSuccess(false).setMessage('Invalid file key').build();
    }

    try {
      const content = await readFile(join(STORAGE_DIR, key));
      return builder.setSuccess(true).setDto(content).build();
    } catch (error) {
      this.logger.error(`Failed to read file ${key}: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('Could not read file')
        .build();
    }
  }

  async delete(key: string): Promise<Result> {
    const builder = new ResultBuilder();

    if (!KEY_PATTERN.test(key)) {
      return builder.setSuccess(false).setMessage('Invalid file key').build();
    }

    try {
      await rm(join(STORAGE_DIR, key), { force: true });
      return builder.setSuccess(true).build();
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${String(error)}`);
      return builder
        .setSuccess(false)
        .setMessage('Could not delete file')
        .build();
    }
  }
}
