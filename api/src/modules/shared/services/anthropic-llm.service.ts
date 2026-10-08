import { createAnthropic } from '@ai-sdk/anthropic';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Output, generateText } from 'ai';
import { Result, ResultBuilder } from '../../../common/classes/result.class';
import { GenerateObjectRequest, LlmService } from './llm.service';

@Injectable()
export class AnthropicLlmService extends LlmService {
  private readonly logger = new Logger(AnthropicLlmService.name);
  private readonly anthropic: ReturnType<typeof createAnthropic>;

  constructor(config: ConfigService) {
    super();
    this.anthropic = createAnthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateObject<T>(
    request: GenerateObjectRequest<T>,
  ): Promise<Result<T>> {
    const builder = new ResultBuilder<T>();

    const startedAt = Date.now();

    try {
      const { output, usage } = await generateText({
        model: this.anthropic(request.model),
        output: Output.object({ schema: request.schema }),
        system: request.system,
        prompt: request.prompt,
        providerOptions: { anthropic: { effort: request.effort } },
      });

      this.logger.log(
        `${request.model} effort=${request.effort ?? 'default'} in=${usage.inputTokens} out=${usage.outputTokens} reasoning=${usage.outputTokenDetails.reasoningTokens ?? 0} time=${Date.now() - startedAt}ms`,
      );

      return builder.setSuccess(true).setDto(output).build();
    } catch (error) {
      return builder
        .setSuccess(false)
        .setMessage(error instanceof Error ? error.message : 'LLM call failed')
        .build();
    }
  }
}
