export const INITIAL_USER_INPUT_SOURCE = 'initial_user_input';
export const CONTACTS_ENTRY = 'contacts';
export const SKILLS_ENTRY = 'skills';

export enum FactSection {
  Contacts = 'contacts',
  Skills = 'skills',
  WorkExperience = 'work_experience',
  Education = 'education',
  Certification = 'certification',
}

export enum FactField {
  FullName = 'full_name',
  Email = 'email',
  Phone = 'phone',
  Location = 'location',
  Link = 'link',
  Company = 'company',
  Title = 'title',
  StartDate = 'start_date',
  EndDate = 'end_date',
  Responsibility = 'responsibility',
  Achievement = 'achievement',
  Skill = 'skill',
  Institution = 'institution',
  Degree = 'degree',
  FieldOfStudy = 'field_of_study',
  Name = 'name',
  Issuer = 'issuer',
  IssueDate = 'issue_date',
}

export const SECTION_FIELDS: Record<FactSection, FactField[]> = {
  [FactSection.Contacts]: [
    FactField.FullName,
    FactField.Email,
    FactField.Phone,
    FactField.Location,
    FactField.Link,
  ],
  [FactSection.Skills]: [FactField.Skill],
  [FactSection.WorkExperience]: [
    FactField.Company,
    FactField.Title,
    FactField.Location,
    FactField.StartDate,
    FactField.EndDate,
    FactField.Responsibility,
    FactField.Achievement,
    FactField.Skill,
  ],
  [FactSection.Education]: [
    FactField.Institution,
    FactField.Degree,
    FactField.FieldOfStudy,
    FactField.StartDate,
    FactField.EndDate,
  ],
  [FactSection.Certification]: [
    FactField.Name,
    FactField.Issuer,
    FactField.IssueDate,
  ],
};

export const FIXED_ENTRIES: Partial<Record<FactSection, string>> = {
  [FactSection.Contacts]: CONTACTS_ENTRY,
  [FactSection.Skills]: SKILLS_ENTRY,
};

export const MULTI_VALUE_FIELDS: ReadonlySet<FactField> = new Set([
  FactField.Link,
  FactField.Responsibility,
  FactField.Achievement,
  FactField.Skill,
]);

export type Evidence = {
  source: string;
  quote: string;
};

export type Fact = {
  id: string;
  section: FactSection;
  entryId: string;
  field: FactField;
  value: string;
  evidence: Evidence;
};
