import { EditorSection } from '../form/editor-section'
import { FormField } from '../form/form-field'

export const ContactSection = () => (
  <EditorSection title="Contact">
    <FormField name="header.fullName" label="Full name" />
    <FormField name="header.email" label="Email" />
    <FormField name="header.phone" label="Phone" />
    <FormField name="header.location" label="Location" />
    <FormField
      name="header.links"
      label="Links (one per line)"
      multiline
      rows={3}
    />
  </EditorSection>
)
