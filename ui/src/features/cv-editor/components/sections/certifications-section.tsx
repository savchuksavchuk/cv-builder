import { useFieldArray, useFormContext } from 'react-hook-form'
import { CV_LIMITS } from '@/entities/cv'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyCertification } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { EditorSection } from '../form/editor-section'
import { FormField } from '../form/form-field'
import { ItemCard } from '../form/item-card'

export const CertificationsSection = () => {
  const { control } = useFormContext<DocumentFormValues>()
  const certifications = useFieldArray({ control, name: 'certifications' })

  return (
    <EditorSection title="Certifications">
      {certifications.fields.map((field, i) => (
        <ItemCard key={field.id} onRemove={() => certifications.remove(i)}>
          <FormField name={`certifications.${i}.name`} label="Name" />
          <FormField name={`certifications.${i}.issuer`} label="Issuer" />
          <FormField
            name={`certifications.${i}.issueDate`}
            label="Issued"
            placeholder="YYYY-MM"
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add certification"
        disabled={certifications.fields.length >= CV_LIMITS.LIST_ITEMS}
        onClick={() => certifications.append(emptyCertification())}
      />
    </EditorSection>
  )
}
