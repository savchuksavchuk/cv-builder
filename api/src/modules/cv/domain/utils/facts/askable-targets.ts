import {
  CONTACTS_ENTRY,
  Fact,
  FactSection,
  SECTION_FIELDS,
} from '../../types/fact';
import {
  Question,
  QuestionStatus,
  QuestionTarget,
  pathOf,
} from '../../types/question';
import { entries } from './fact-entries';

export function askableTargets(
  facts: Fact[],
  questions: Question[],
): Map<string, QuestionTarget> {
  const asked = new Set(questions.map((q) => pathOf(q.target)));
  const skipped = new Set(
    questions
      .filter((q) => q.status === QuestionStatus.Dismissed)
      .map((q) => q.target.entryId),
  );
  const targets: QuestionTarget[] = [];

  if (!entries(facts, FactSection.WorkExperience).length) {
    targets.push({
      section: FactSection.WorkExperience,
      entryId: null,
      field: null,
    });
  }

  for (const section of Object.values(FactSection)) {
    const ids =
      section === FactSection.Contacts
        ? [CONTACTS_ENTRY]
        : entries(facts, section).map((entry) => entry.id);

    for (const entryId of ids) {
      for (const field of SECTION_FIELDS[section]) {
        targets.push({ section, entryId, field });
      }
    }
  }

  return new Map(
    targets
      .filter(
        (target) =>
          !asked.has(pathOf(target)) &&
          (target.section === FactSection.Contacts ||
            !skipped.has(target.entryId)),
      )
      .map((target) => [pathOf(target), target]),
  );
}
