import { zodResolver } from '@hookform/resolvers/zod'
import type { CvDocument } from '@cv-builder/cv-template'
import { Loader2 } from 'lucide-react'
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
  isSaving = false,
  error = null,
  onSave,
  onCancel,
}: {
  document: CvDocument
  isSaving?: boolean
  error?: string | null
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

        <div className="bg-background/95 sticky bottom-0 -mx-4 grid gap-2 border-t px-4 py-3 backdrop-blur">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
