import { useFormContext } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import type { DocumentFormValues } from '../../utils/document-form'
import { EditorSection } from '../form/editor-section'
import { Field } from '../form/field'

export const ContactSection = () => {
  const { register } = useFormContext<DocumentFormValues>()

  return (
    <EditorSection title="Contact">
      <Field label="Full name">
        <Input {...register('header.fullName')} />
      </Field>
      <Field label="Email">
        <Input {...register('header.email')} />
      </Field>
      <Field label="Phone">
        <Input {...register('header.phone')} />
      </Field>
      <Field label="Location">
        <Input {...register('header.location')} />
      </Field>
      <Field label="Links (one per line)">
        <Textarea rows={3} {...register('header.links')} />
      </Field>
    </EditorSection>
  )
}
