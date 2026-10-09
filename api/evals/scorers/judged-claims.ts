import { Verdict } from '../../src/modules/cv/domain/utils/document/review-document';
import type { ValidationCase } from '../datasets/validation-cases';

export type JudgedClaim = {
  text: string;
  supported: boolean;
  judgedSupported: boolean;
  note: string;
  reason: string;
};

export function judgedClaims(
  testCase: ValidationCase,
  verdict: Verdict,
): JudgedClaim[] {
  const verdicts = new Map(verdict.bullets.map((b) => [b.id, b]));

  const summary: JudgedClaim = {
    text: testCase.summary.text,
    supported: testCase.summary.supported,
    judgedSupported: verdict.summarySupported,
    note: testCase.summary.note,
    reason: verdict.summaryReason,
  };

  const bullets = testCase.bullets.map((bullet) => ({
    text: bullet.text,
    supported: bullet.supported,
    judgedSupported: verdicts.get(bullet.id)?.supported === true,
    note: bullet.note,
    reason: verdicts.get(bullet.id)?.reason ?? 'no verdict',
  }));

  return [summary, ...bullets];
}
