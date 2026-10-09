import { CvDocument } from '../../types/cv-document';
import { Fact } from '../../types/fact';
import { sourceValues } from '../facts/source-values';

export type Verdict = {
  summarySupported: boolean;
  summaryReason: string;
  bullets: { id: string; supported: boolean; reason: string }[];
};

export type Review = {
  // Empty when the judge supports everything.
  feedback: string[];
  // The document with rejected parts removed or replaced by the raw fact.
  safeDocument: CvDocument;
};

export function reviewDocument(
  document: CvDocument,
  verdict: Verdict,
  facts: Fact[],
): Review {
  const values = sourceValues(facts);
  const verdicts = new Map(verdict.bullets.map((b) => [b.id, b]));
  const feedback: string[] = [];

  const experience = document.experience.map((job) => ({
    ...job,
    bullets: job.bullets.flatMap((bullet) => {
      const result = verdicts.get(bullet.id);

      if (result?.supported) {
        return [bullet];
      }

      const reason = result?.reason || 'no verdict from the judge';
      feedback.push(`Bullet "${bullet.text}" was rejected: ${reason}`);

      const source = bullet.sourceIds
        .map((id) => values.get(id))
        .find((value) => !!value);

      return source ? [{ ...bullet, text: source }] : [];
    }),
  }));

  const summaryRejected = !!document.summary && !verdict.summarySupported;

  if (summaryRejected) {
    feedback.push(
      `Summary was rejected: ${verdict.summaryReason || 'not supported by the facts'}`,
    );
  }

  return {
    feedback,
    safeDocument: {
      ...document,
      summary: summaryRejected ? null : document.summary,
      experience,
    },
  };
}
