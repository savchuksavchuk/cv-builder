import type { CvDocument } from '@cv-builder/cv-template'
import { z } from 'zod'

const text = z.string().trim()
const startMonth = text.regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/, 'Use YYYY-MM')
const endMonth = text.regex(
  /^(\d{4}-(0[1-9]|1[0-2])|present)?$/,
  'Use YYYY-MM or present',
)

export const DocumentFormSchema = z.object({
  header: z.object({
    fullName: text,
    email: text,
    phone: text,
    location: text,
    links: text,
  }),
  summary: text,
  skills: text,
  experience: z.array(
    z.object({
      id: z.string(),
      company: text,
      title: text,
      location: text,
      startDate: startMonth,
      endDate: endMonth,
      bullets: z.array(
        z.object({ id: z.string(), text, sourceIds: z.array(z.string()) }),
      ),
    }),
  ),
  education: z.array(
    z.object({
      id: z.string(),
      institution: text,
      degree: text,
      fieldOfStudy: text,
      startDate: startMonth,
      endDate: endMonth,
    }),
  ),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: text,
      issuer: text,
      issueDate: startMonth,
    }),
  ),
})

export type DocumentFormValues = z.infer<typeof DocumentFormSchema>

const orEmpty = (value: string | null) => value ?? ''
const orNull = (value: string) => value.trim() || null
const toList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean)

export const toFormValues = (doc: CvDocument): DocumentFormValues => ({
  header: {
    fullName: orEmpty(doc.header.fullName),
    email: orEmpty(doc.header.email),
    phone: orEmpty(doc.header.phone),
    location: orEmpty(doc.header.location),
    links: doc.header.links.join('\n'),
  },
  summary: orEmpty(doc.summary),
  skills: doc.skills.join('\n'),
  experience: doc.experience.map((e) => ({
    ...e,
    company: orEmpty(e.company),
    title: orEmpty(e.title),
    location: orEmpty(e.location),
    startDate: orEmpty(e.startDate),
    endDate: orEmpty(e.endDate),
  })),
  education: doc.education.map((e) => ({
    ...e,
    institution: orEmpty(e.institution),
    degree: orEmpty(e.degree),
    fieldOfStudy: orEmpty(e.fieldOfStudy),
    startDate: orEmpty(e.startDate),
    endDate: orEmpty(e.endDate),
  })),
  certifications: doc.certifications.map((c) => ({
    ...c,
    name: orEmpty(c.name),
    issuer: orEmpty(c.issuer),
    issueDate: orEmpty(c.issueDate),
  })),
})

export const toDocument = (values: DocumentFormValues): CvDocument => ({
  header: {
    fullName: orNull(values.header.fullName),
    email: orNull(values.header.email),
    phone: orNull(values.header.phone),
    location: orNull(values.header.location),
    links: toList(values.header.links),
  },
  summary: orNull(values.summary),
  skills: toList(values.skills),
  experience: values.experience.map((e) => ({
    ...e,
    company: orNull(e.company),
    title: orNull(e.title),
    location: orNull(e.location),
    startDate: orNull(e.startDate),
    endDate: orNull(e.endDate),
    bullets: e.bullets.filter((b) => b.text),
  })),
  education: values.education.map((e) => ({
    ...e,
    institution: orNull(e.institution),
    degree: orNull(e.degree),
    fieldOfStudy: orNull(e.fieldOfStudy),
    startDate: orNull(e.startDate),
    endDate: orNull(e.endDate),
  })),
  certifications: values.certifications.map((c) => ({
    ...c,
    name: orNull(c.name),
    issuer: orNull(c.issuer),
    issueDate: orNull(c.issueDate),
  })),
})
