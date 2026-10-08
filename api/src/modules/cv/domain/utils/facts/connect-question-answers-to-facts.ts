import { Fact, MULTI_VALUE_FIELDS } from '../../types/fact';

export function connectQuestionAnswersToFacts(
  facts: Fact[],
  answers: Fact[],
): Fact[] {
  return answers.reduce((connected, answer) => {
    const old = connected.findIndex(
      (fact) => fact.entryId === answer.entryId && fact.field === answer.field,
    );

    return MULTI_VALUE_FIELDS.has(answer.field) || old < 0
      ? [...connected, answer]
      : connected.with(old, answer);
  }, facts);
}
