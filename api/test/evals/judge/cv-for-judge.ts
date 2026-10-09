import { CvDocument } from '../../../src/modules/cv/domain/types/cv-document';

// What the judge reads: the text of the CV, without ids and internal links.
export function cvForJudge(document: CvDocument): string {
  return JSON.stringify(
    {
      summary: document.summary,
      skills: document.skills,
      experience: document.experience.map((job) => ({
        company: job.company,
        title: job.title,
        bullets: job.bullets.map((bullet) => bullet.text),
      })),
    },
    null,
    2,
  );
}
