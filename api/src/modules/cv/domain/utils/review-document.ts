import { CvDocument } from '../types/cv-document';

export type Verdict = {
  summarySupported: boolean;
  summaryReason: string;
  bullets: { id: string; supported: boolean; reason: string }[];
};

export type Review = {
  rejectedBullets: Map<string, string>;
  summaryRejected: boolean;
  feedback: string[];
};

export function reviewDocument(document: CvDocument, verdict: Verdict): Review {
  const byId = new Map(verdict.bullets.map((b) => [b.id, b]));
  const rejectedBullets = new Map<string, string>();
  const feedback: string[] = [];

  for (const job of document.experience) {
    for (const bullet of job.bullets) {
      const result = byId.get(bullet.id);

      if (!result?.supported) {
        const reason = result?.reason || 'no verdict from the judge';
        rejectedBullets.set(bullet.id, reason);
        feedback.push(`Bullet "${bullet.text}" was rejected: ${reason}`);
      }
    }
  }

  const summaryRejected = !!document.summary && !verdict.summarySupported;
  if (summaryRejected) {
    feedback.push(
      `Summary was rejected: ${verdict.summaryReason || 'not supported by the facts'}`,
    );
  }

  return { rejectedBullets, summaryRejected, feedback };
}

export function sanitizeDocument(
  document: CvDocument,
  review: Review,
  values: Map<string, string>,
): CvDocument {
  return {
    ...document,
    summary: review.summaryRejected ? null : document.summary,
    experience: document.experience.map((job) => ({
      ...job,
      bullets: job.bullets.flatMap((bullet) => {
        if (!review.rejectedBullets.has(bullet.id)) {
          return [bullet];
        }

        const source = bullet.sourceIds
          .map((id) => values.get(id))
          .find((value) => !!value);

        return source ? [{ ...bullet, text: source }] : [];
      }),
    })),
  };
}
