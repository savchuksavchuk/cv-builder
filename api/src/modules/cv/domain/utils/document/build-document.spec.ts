import { MAX_BULLET_CHARS } from '../../constants/cv-limits.constants';
import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../types/fact';
import { Composition, buildDocument } from './build-document';

function factOf(
  id: string,
  entryId: string,
  section: FactSection,
  field: FactField,
  value: string,
): Fact {
  return {
    id,
    section,
    entryId,
    field,
    value,
    evidence: { source: INITIAL_USER_INPUT_SOURCE, quote: value },
  };
}

const { Contacts, Skills, WorkExperience, Education, Certification } =
  FactSection;

const facts: Fact[] = [
  factOf('name', 'contacts', Contacts, FactField.FullName, 'Jane Doe'),
  factOf('email', 'contacts', Contacts, FactField.Email, 'jane@x.io'),
  factOf('link', 'contacts', Contacts, FactField.Link, 'github.com/jane'),
  factOf('go', 'skills', Skills, FactField.Skill, 'Go'),
  factOf('sql', 'skills', Skills, FactField.Skill, 'SQL'),
  factOf('a-company', 'job-a', WorkExperience, FactField.Company, 'Acme'),
  factOf('a-title', 'job-a', WorkExperience, FactField.Title, 'Developer'),
  factOf(
    'a-duty',
    'job-a',
    WorkExperience,
    FactField.Responsibility,
    'built APIs',
  ),
  factOf(
    'a-result',
    'job-a',
    WorkExperience,
    FactField.Achievement,
    'cut latency by 40%',
  ),
  factOf('b-company', 'job-b', WorkExperience, FactField.Company, 'Beta'),
  factOf(
    'b-duty',
    'job-b',
    WorkExperience,
    FactField.Responsibility,
    'ran on-call',
  ),
  factOf('school', 'edu-1', Education, FactField.Institution, 'MIT'),
  factOf('cert', 'cert-1', Certification, FactField.Name, 'AWS Architect'),
];

// A valid composition; each test overrides the part it is about.
function compositionWith(overrides: Partial<Composition>): Composition {
  return {
    summary: 'Backend developer.',
    skillIds: ['go', 'sql'],
    jobOrder: ['job-a', 'job-b'],
    bullets: [],
    ...overrides,
  };
}

function bulletTextsOf(composition: Composition, jobIndex: number): string[] {
  const document = buildDocument(facts, composition);

  return document.experience[jobIndex].bullets.map((b) => b.text);
}

describe('buildDocument', () => {
  describe('parts taken from the facts', () => {
    it('takes the header from the facts', () => {
      const { header } = buildDocument(facts, compositionWith({}));

      expect(header.fullName).toBe('Jane Doe');
      expect(header.email).toBe('jane@x.io');
      expect(header.links).toEqual(['github.com/jane']);
      expect(header.phone).toBeNull();
    });

    it('takes education and certifications from the facts', () => {
      const document = buildDocument(facts, compositionWith({}));

      expect(document.education[0].institution).toBe('MIT');
      expect(document.certifications[0].name).toBe('AWS Architect');
    });

    it('takes job details from the facts', () => {
      const document = buildDocument(facts, compositionWith({}));

      expect(document.experience[0].company).toBe('Acme');
      expect(document.experience[0].title).toBe('Developer');
    });
  });

  describe('summary', () => {
    it('trims the summary', () => {
      const document = buildDocument(
        facts,
        compositionWith({ summary: '  Backend developer.  ' }),
      );

      expect(document.summary).toBe('Backend developer.');
    });

    it('turns a blank summary into null', () => {
      const document = buildDocument(facts, compositionWith({ summary: '  ' }));

      expect(document.summary).toBeNull();
    });
  });

  describe('bullets', () => {
    it('keeps a bullet based on facts of its own job', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-a', text: 'Built APIs', sourceIds: ['a-duty'] },
        ],
      });

      const [bullet] = buildDocument(facts, composition).experience[0].bullets;

      expect(bullet.text).toBe('Built APIs');
      expect(bullet.sourceIds).toEqual(['a-duty']);
    });

    it('removes sources that belong to another job or do not exist', () => {
      const composition = compositionWith({
        bullets: [
          {
            jobId: 'job-a',
            text: 'Built APIs',
            sourceIds: ['a-duty', 'b-duty', 'invented'],
          },
        ],
      });

      const [bullet] = buildDocument(facts, composition).experience[0].bullets;

      expect(bullet.sourceIds).toEqual(['a-duty']);
    });

    it('drops a bullet that has no valid source left', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-a', text: 'Built APIs', sourceIds: ['a-duty'] },
          { jobId: 'job-a', text: 'Won a Nobel prize', sourceIds: ['b-duty'] },
          { jobId: 'job-a', text: 'Ran the company', sourceIds: [] },
        ],
      });

      expect(bulletTextsOf(composition, 0)).toEqual(['Built APIs']);
    });

    it('drops an empty bullet', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-a', text: 'Built APIs', sourceIds: ['a-duty'] },
          { jobId: 'job-a', text: '   ', sourceIds: ['a-result'] },
        ],
      });

      expect(bulletTextsOf(composition, 0)).toEqual(['Built APIs']);
    });

    it('drops a bullet that is too long', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-a', text: 'Built APIs', sourceIds: ['a-duty'] },
          {
            jobId: 'job-a',
            text: 'x'.repeat(MAX_BULLET_CHARS + 1),
            sourceIds: ['a-result'],
          },
        ],
      });

      expect(bulletTextsOf(composition, 0)).toEqual(['Built APIs']);
    });

    it('trims the bullet text', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-a', text: '  Built APIs ', sourceIds: ['a-duty'] },
        ],
      });

      expect(bulletTextsOf(composition, 0)).toEqual(['Built APIs']);
    });

    it('puts each bullet under the job it names', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-b', text: 'Carried the pager', sourceIds: ['b-duty'] },
          { jobId: 'job-a', text: 'Built APIs', sourceIds: ['a-duty'] },
        ],
      });

      expect(bulletTextsOf(composition, 0)).toEqual(['Built APIs']);
      expect(bulletTextsOf(composition, 1)).toEqual(['Carried the pager']);
    });

    it('ignores a bullet for an unknown job', () => {
      const composition = compositionWith({
        bullets: [
          { jobId: 'job-x', text: 'Built APIs', sourceIds: ['a-duty'] },
        ],
      });

      const document = buildDocument(facts, composition);

      expect(document.experience).toHaveLength(2);
    });

    it('falls back to the raw facts when no composed bullet is valid', () => {
      const composition = compositionWith({
        bullets: [{ jobId: 'job-a', text: 'Invented', sourceIds: ['b-duty'] }],
      });

      const [bullet1, bullet2] = buildDocument(facts, composition).experience[0]
        .bullets;

      expect(bullet1).toMatchObject({
        text: 'built APIs',
        sourceIds: ['a-duty'],
      });
      expect(bullet2).toMatchObject({
        text: 'cut latency by 40%',
        sourceIds: ['a-result'],
      });
    });

    it('falls back to the raw facts when there are no composed bullets', () => {
      expect(bulletTextsOf(compositionWith({ bullets: [] }), 1)).toEqual([
        'ran on-call',
      ]);
    });
  });

  describe('skills', () => {
    it('shows the listed skills in the given order', () => {
      const document = buildDocument(
        facts,
        compositionWith({ skillIds: ['sql', 'go'] }),
      );

      expect(document.skills).toEqual(['SQL', 'Go']);
    });

    it('ignores unknown skill ids', () => {
      const document = buildDocument(
        facts,
        compositionWith({ skillIds: ['go', 'invented'] }),
      );

      expect(document.skills).toEqual(['Go']);
    });

    it('does not show the same skill twice', () => {
      const document = buildDocument(
        facts,
        compositionWith({ skillIds: ['go', 'go'] }),
      );

      expect(document.skills).toEqual(['Go']);
    });

    it('does not take a fact that is not a skill', () => {
      const document = buildDocument(
        facts,
        compositionWith({ skillIds: ['a-company'] }),
      );

      expect(document.skills).toEqual([]);
    });
  });

  describe('job order', () => {
    it('orders the jobs as composed', () => {
      const document = buildDocument(
        facts,
        compositionWith({ jobOrder: ['job-b', 'job-a'] }),
      );

      expect(document.experience.map((job) => job.company)).toEqual([
        'Beta',
        'Acme',
      ]);
    });

    it('ignores unknown job ids', () => {
      const document = buildDocument(
        facts,
        compositionWith({ jobOrder: ['job-x', 'job-b', 'job-a'] }),
      );

      expect(document.experience.map((job) => job.company)).toEqual([
        'Beta',
        'Acme',
      ]);
    });

    it('appends the jobs it did not mention', () => {
      const document = buildDocument(
        facts,
        compositionWith({ jobOrder: ['job-b'] }),
      );

      expect(document.experience.map((job) => job.company)).toEqual([
        'Beta',
        'Acme',
      ]);
    });

    it('never drops a job', () => {
      const document = buildDocument(facts, compositionWith({ jobOrder: [] }));

      expect(document.experience).toHaveLength(2);
    });
  });
});
