import { Fact } from '../../types/fact';
import { Question } from '../../types/question';
import { RawFact, parseExtractedFacts } from './parse-extracted-facts';

export type AnswerRow = Omit<RawFact, 'section'> & { questionId: string };

export function parseQuestionAnswers(
  questions: Question[],
  rows: AnswerRow[],
): Fact[] {
  return questions.flatMap(({ id, target }) => {
    const own = rows
      .filter(
        (row) =>
          row.questionId === id &&
          (target.field === null || row.field === target.field),
      )
      .map((row) => ({ ...row, section: target.section }));

    return parseExtractedFacts(own, id, target.entryId ?? undefined);
  });
}
