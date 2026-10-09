import { Cv } from '../../../domain/entities/cv.entity';
import {
  Fact,
  FactField,
  FactSection,
  INITIAL_USER_INPUT_SOURCE,
} from '../../../domain/types/fact';
import { buildComposeCvPrompt } from './compose-cv.prompt';
import {
  INJECTION,
  INJECTION_MARKER,
  withoutUntrustedBlocks,
} from '../../../testing/untrusted.testing';

function companyFact(value: string): Fact {
  return {
    id: 'fact-1',
    section: FactSection.WorkExperience,
    entryId: 'job-1',
    field: FactField.Company,
    value,
    evidence: { source: INITIAL_USER_INPUT_SOURCE, quote: value },
  };
}

function cvWith(targetRole: string, factValue: string): Cv {
  const cv = Cv.create('user-1', targetRole, '', null);
  cv.facts = [companyFact(factValue)];
  return cv;
}

describe('buildComposeCvPrompt', () => {
  it('keeps the target role inside an untrusted block', () => {
    const prompt = buildComposeCvPrompt(cvWith(INJECTION, 'Acme'));

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the facts inside an untrusted block', () => {
    const prompt = buildComposeCvPrompt(cvWith('Engineer', INJECTION));

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('keeps the previous draft problems inside untrusted blocks', () => {
    const cv = cvWith('Engineer', 'Acme');
    cv.composeFeedback = ['first problem', INJECTION];

    const prompt = buildComposeCvPrompt(cv);

    expect(prompt).toContain(INJECTION_MARKER);
    expect(withoutUntrustedBlocks(prompt)).not.toContain(INJECTION_MARKER);
  });

  it('adds the previous draft problems only when there are some', () => {
    const cv = cvWith('Engineer', 'Acme');

    expect(buildComposeCvPrompt(cv)).not.toContain('previous_draft_problems');

    cv.composeFeedback = ['bad bullet'];

    expect(buildComposeCvPrompt(cv)).toContain('previous_draft_problems');
  });
});
