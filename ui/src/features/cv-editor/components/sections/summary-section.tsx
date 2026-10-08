import { CV_LIMITS } from '@/entities/cv'
import { EditorSection } from '../form/editor-section'
import { FormField } from '../form/form-field'

export const SummarySection = () => (
  <EditorSection title="Summary">
    <FormField
      name="summary"
      ariaLabel="Summary"
      multiline
      rows={4}
      max={CV_LIMITS.SUMMARY}
    />
  </EditorSection>
)
