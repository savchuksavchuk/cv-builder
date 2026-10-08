import { get, useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyCertification } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { EditorSection } from '../form/editor-section'
import { Field } from '../form/field'
import { ItemCard } from '../form/item-card'

export const CertificationsSection = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DocumentFormValues>()
  const certifications = useFieldArray({ control, name: 'certifications' })

  return (
    <EditorSection title="Certifications">
      {certifications.fields.map((field, i) => (
        <ItemCard key={field.id} onRemove={() => certifications.remove(i)}>
          <Field label="Name">
            <Input {...register(`certifications.${i}.name`)} />
          </Field>
          <Field label="Issuer">
            <Input {...register(`certifications.${i}.issuer`)} />
          </Field>
          <Field
            label="Issued"
            error={get(errors, `certifications.${i}.issueDate`)?.message}
          >
            <Input
              placeholder="YYYY-MM"
              {...register(`certifications.${i}.issueDate`)}
            />
          </Field>
        </ItemCard>
      ))}
      <AddButton
        label="Add certification"
        onClick={() => certifications.append(emptyCertification())}
      />
    </EditorSection>
  )
}
