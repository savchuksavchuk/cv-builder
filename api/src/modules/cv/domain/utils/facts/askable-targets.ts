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
  const wholeEntry = new Set(
    questions
      .filter((q) => q.target.field === null)
      .map((q) => q.target.entryId),
  );
  const touched = new Set(questions.map((q) => q.target.entryId));
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
    if (section === FactSection.Skills) {
      continue;
    }
    const ids =
      section === FactSection.Contacts
        ? [CONTACTS_ENTRY]
        : entries(facts, section).map((entry) => entry.id);

    for (const entryId of ids) {
      targets.push({ section, entryId, field: null });
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
          !(target.field !== null && wholeEntry.has(target.entryId)) &&
          !(
            target.field === null &&
            target.entryId !== null &&
            touched.has(target.entryId)
          ) &&
          !skipped.has(target.entryId),
      )
      .map((target) => [pathOf(target), target]),
  );
}
