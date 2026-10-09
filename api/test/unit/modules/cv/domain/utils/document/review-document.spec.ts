import { CvDocument } from '../../../../../../../src/modules/cv/domain/types/cv-document';
import {
  Fact,
  FactField,
  FactSection,
} from '../../../../../../../src/modules/cv/domain/types/fact';
import {
  Verdict,
  reviewDocument,
} from '../../../../../../../src/modules/cv/domain/utils/document/review-document';

const fact: Fact = {
  id: 'f1',
  section: FactSection.WorkExperience,
  entryId: 'job',
  field: FactField.Achievement,
  value: 'Cut latency',
  evidence: { source: 'src', quote: 'Cut latency' },
};

const document: CvDocument = {
  header: {
    fullName: null,
    email: null,
    phone: null,
    location: null,
    links: [],
  },
  summary: 'Backend engineer',
  skills: [],
  experience: [
    {
      id: 'job',
      company: null,
      title: null,
      location: null,
      startDate: null,
      endDate: null,
      bullets: [
        { id: 'b1', text: 'Cut latency by 40%', sourceIds: ['f1'] },
        { id: 'b2', text: 'Led a team', sourceIds: [] },
      ],
    },
  ],
  education: [],
  certifications: [],
};

const verdict = (overrides: Partial<Verdict> = {}): Verdict => ({
  summarySupported: true,
  summaryReason: '',
  bullets: [
    { id: 'b1', supported: true, reason: '' },
    { id: 'b2', supported: true, reason: '' },
  ],
  ...overrides,
});

describe('reviewDocument', () => {
  it('returns the document and no feedback when everything is supported', () => {
    const { feedback, safeDocument } = reviewDocument(document, verdict(), [
      fact,
    ]);

    expect(feedback).toEqual([]);
    expect(safeDocument).toEqual(document);
  });

  it('replaces a rejected bullet by its raw fact and drops one without a source', () => {
    const { feedback, safeDocument } = reviewDocument(
      document,
      verdict({
        bullets: [
          { id: 'b1', supported: false, reason: 'invented 40%' },
          { id: 'b2', supported: false, reason: 'no source' },
        ],
      }),
      [fact],
    );

    expect(safeDocument.experience[0].bullets.map((b) => b.text)).toEqual([
      'Cut latency',
    ]);
    expect(feedback).toEqual([
      'Bullet "Cut latency by 40%" was rejected: invented 40%',
      'Bullet "Led a team" was rejected: no source',
    ]);
  });

  it('rejects a bullet the judge gave no verdict for', () => {
    const { feedback } = reviewDocument(
      document,
      verdict({ bullets: [{ id: 'b1', supported: true, reason: '' }] }),
      [fact],
    );

    expect(feedback).toEqual([
      'Bullet "Led a team" was rejected: no verdict from the judge',
    ]);
  });

  it('nulls a rejected summary', () => {
    const { feedback, safeDocument } = reviewDocument(
      document,
      verdict({ summarySupported: false, summaryReason: 'invented seniority' }),
      [fact],
    );

    expect(safeDocument.summary).toBeNull();
    expect(feedback).toEqual(['Summary was rejected: invented seniority']);
  });
});
