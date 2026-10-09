import type { ConfigService } from '@nestjs/config';
import { AnthropicLlmService } from '../../src/modules/shared/services/anthropic-llm.service';

export function productLlm(): AnthropicLlmService {
  const config = {
    getOrThrow: () => process.env.ANTHROPIC_API_KEY,
  } as unknown as ConfigService;

  return new AnthropicLlmService(config);
}
