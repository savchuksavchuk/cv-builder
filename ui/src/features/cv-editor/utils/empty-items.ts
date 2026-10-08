import type { DocumentFormValues } from './document-form'

type Item<K extends keyof DocumentFormValues> =
  DocumentFormValues[K] extends (infer T)[] ? T : never

export const emptyBullet = () => ({
  id: crypto.randomUUID(),
  text: '',
  sourceIds: [],
})

export const emptyExperience = (): Item<'experience'> => ({
  id: crypto.randomUUID(),
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  bullets: [],
})

export const emptyEducation = (): Item<'education'> => ({
  id: crypto.randomUUID(),
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
})

export const emptyCertification = (): Item<'certifications'> => ({
  id: crypto.randomUUID(),
  name: '',
  issuer: '',
  issueDate: '',
})
