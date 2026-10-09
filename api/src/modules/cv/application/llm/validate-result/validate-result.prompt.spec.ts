import { CvDocument } from '../../../domain/types/cv-document';
import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../../domain/types/fact';
import { buildValidateResultPrompt } from './validate-result.prompt';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../../testing/untrusted.testing';

function dutyFact(value: string): Fact {
  return {
    id: 'duty-1',
    section: FactSection.WorkExperience,
    entryId: 'job-1',
    field: FactField.Responsibility,
    value,
    evidence: { source: INITIAL_USER_INPUT_SOURCE, quote: value },
  };
}

function documentWith(summary: string, bulletText: string): CvDocument {
  return {
    summary,
    experience: [
      {
        id: 'job-1',
        bullets: [{ id: 'b1', text: bulletText, sourceIds: ['duty-1'] }],
      },
    ],
  } as CvDocument;
}

describe('buildValidateResultPrompt', () => {
  it('keeps the bullets inside an untrusted block', () => {
    const document = documentWith('Summary', INJECTION);

    const prompt = buildValidateResultPrompt(document, [
      dutyFact('built APIs'),
    ]);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the summary inside an untrusted block', () => {
    const document = documentWith(INJECTION, 'Built APIs');

    const prompt = buildValidateResultPrompt(document, [
      dutyFact('built APIs'),
    ]);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the facts inside an untrusted block', () => {
    const document = documentWith('Summary', 'Built APIs');

    const prompt = buildValidateResultPrompt(document, [dutyFact(INJECTION)]);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('gives each bullet the facts it is based on', () => {
    const document = documentWith('Summary', 'Built APIs');

    const prompt = buildValidateResultPrompt(document, [
      dutyFact('built APIs'),
    ]);

    expect(prompt).toContain('"sources": [\n      "built APIs"\n    ]');
  });
});
