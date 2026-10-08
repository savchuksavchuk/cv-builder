import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/shared/ui/textarea'
import type { DocumentFormValues } from '../../utils/document-form'
import { EditorSection } from '../form/editor-section'

export const SummarySection = () => {
  const { register } = useFormContext<DocumentFormValues>()

  return (
    <EditorSection title="Summary">
      <Textarea rows={4} aria-label="Summary" {...register('summary')} />
    </EditorSection>
  )
}
