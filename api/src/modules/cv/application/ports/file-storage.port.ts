import { Result } from '../../../../common/classes/result.class';

export interface FileStoragePort {
  save(content: Buffer): Promise<Result<string>>;
  read(key: string): Promise<Result<Buffer>>;
  delete(key: string): Promise<Result>;
}

export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');
