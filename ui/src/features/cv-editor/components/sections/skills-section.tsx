import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/shared/ui/textarea'
import type { DocumentFormValues } from '../../utils/document-form'
import { EditorSection } from '../form/editor-section'

export const SkillsSection = () => {
  const { register } = useFormContext<DocumentFormValues>()

  return (
    <EditorSection title="Skills">
      <Textarea
        rows={3}
        aria-label="Skills"
        placeholder="Comma or new line separated"
        {...register('skills')}
      />
    </EditorSection>
  )
}
