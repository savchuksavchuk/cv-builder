import { EditorSection } from '../form/editor-section'
import { FormField } from '../form/form-field'

export const SkillsSection = () => (
  <EditorSection title="Skills">
    <FormField
      name="skills"
      ariaLabel="Skills"
      placeholder="Comma or new line separated"
      multiline
      rows={3}
    />
  </EditorSection>
)
