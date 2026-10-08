import { zodResolver } from '@hookform/resolvers/zod'
import type { CvDocument } from '@cv-builder/cv-template'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import {
  DocumentFormSchema,
  toDocument,
  toFormValues,
  type DocumentFormValues,
} from '../utils/document-form'
import { CertificationsSection } from './sections/certifications-section'
import { ContactSection } from './sections/contact-section'
import { EducationSection } from './sections/education-section'
import { ExperienceSection } from './sections/experience-section'
import { SkillsSection } from './sections/skills-section'
import { SummarySection } from './sections/summary-section'

export const CvEditor = ({
  document,
  onSave,
  onCancel,
}: {
  document: CvDocument
  onSave: (document: CvDocument) => void
  onCancel: () => void
}) => {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: toFormValues(document),
  })

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSave(toDocument(values)))}
        noValidate
        className="grid gap-8"
      >
        <ContactSection />
        <SummarySection />
        <SkillsSection />
        <ExperienceSection />
        <EducationSection />
        <CertificationsSection />

        <div className="bg-background/95 sticky bottom-0 -mx-4 flex justify-end gap-3 border-t px-4 py-3 backdrop-blur">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </FormProvider>
  )
}
