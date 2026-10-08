import { z } from 'zod';
import { Result } from '../../../common/classes/result.class';

export enum LlmModel {
  Sonnet = 'claude-sonnet-5-5',
  Haiku = 'claude-haiku-5-5',
}

export type LlmEffort = 'low' | 'medium' | 'high';

export type GenerateObjectRequest<T> = {
  model: LlmModel;
  effort?: LlmEffort;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
};

export abstract class LlmService {
  abstract generateObject<T>(
    request: GenerateObjectRequest<T>,
  ): Promise<Result<T>>;
}
