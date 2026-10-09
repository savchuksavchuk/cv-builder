import { validateResultOutput } from '../../../src/modules/cv/application/llm/validate-result/validate-result.output';
import {
  VALIDATE_RESULT_SYSTEM,
  buildValidateResultPrompt,
} from '../../../src/modules/cv/application/llm/validate-result/validate-result.prompt';
import {
  STEP_EFFORT,
  STEP_MODELS,
} from '../../../src/modules/cv/domain/constants/cv-pipeline.constants';
import { CvDocument } from '../../../src/modules/cv/domain/types/cv-document';
import { CvStep } from '../../../src/modules/cv/domain/types/cv-step';
import { Fact } from '../../../src/modules/cv/domain/types/fact';
import { Verdict } from '../../../src/modules/cv/domain/utils/document/review-document';
import { candidates } from '../datasets/candidates';
import type { ValidationCase } from '../datasets/validation-cases';
import { productLlm } from './product-llm';

function factsOf(candidateName: string): Fact[] {
  const candidate = candidates.find((c) => c.name === candidateName);

  if (!candidate) {
    throw new Error(`There is no candidate named ${candidateName}`);
  }

  return candidate.facts;
}

function documentToCheck(testCase: ValidationCase): CvDocument {
  const bullets = testCase.bullets.map(({ id, text, sourceIds }) => ({
    id,
    text,
    sourceIds,
  }));

  return {
    summary: testCase.summary.text,
    experience: [{ id: 'job-1', bullets }],
  } as CvDocument;
}

export async function validateResult(
  testCase: ValidationCase,
): Promise<Verdict> {
  const facts = factsOf(testCase.candidate);
  const document = documentToCheck(testCase);

  const answer = await productLlm().generateObject({
    model: STEP_MODELS[CvStep.ValidateResult]!,
    effort: STEP_EFFORT[CvStep.ValidateResult],
    schema: validateResultOutput,
    system: VALIDATE_RESULT_SYSTEM,
    prompt: buildValidateResultPrompt(document, facts),
  });

  if (!answer.success || !answer.dto) {
    throw new Error(answer.message);
  }

  return answer.dto;
}
