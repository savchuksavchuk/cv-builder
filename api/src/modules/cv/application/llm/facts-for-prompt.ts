import { VerifiableSections } from '../../domain/utils/verify-evidence';

export function factsForPrompt(sections: VerifiableSections): string {
  const items = (list: { id: string; value: string | null }[]) =>
    list
      .filter((item) => item.value)
      .map((item) => ({ id: item.id, text: item.value }));

  return JSON.stringify(
    {
      jobs: sections.workExperience.map((job) => ({
        id: job.id,
        company: job.company.value,
        title: job.title.value,
        startDate: job.startDate.value,
        endDate: job.endDate.value,
        responsibilities: items(job.responsibilities),
        achievements: items(job.achievements),
        skills: items(job.skills),
      })),
      education: sections.education.map((item) => ({
        institution: item.institution.value,
        degree: item.degree.value,
        fieldOfStudy: item.fieldOfStudy.value,
      })),
      certifications: sections.certifications.map((item) => item.name.value),
    },
    null,
    2,
  );
}
