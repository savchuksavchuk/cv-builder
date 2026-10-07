import { z } from 'zod';
import { Result } from '../../../common/classes/result.class';

export enum LlmModel {
  Sonnet = 'claude-sonnet-5-5',
  Haiku = 'claude-haiku-4-5-20251001',
}

export type GenerateObjectRequest<T> = {
  model: LlmModel;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
};

export abstract class LlmService {
  abstract generateObject<T>(
    request: GenerateObjectRequest<T>,
  ): Promise<Result<T>>;
}
