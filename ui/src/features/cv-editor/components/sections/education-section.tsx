import { useFieldArray, useFormContext } from 'react-hook-form'
import { CV_LIMITS } from '@/entities/cv'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyEducation } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { DateRangeFields } from '../form/date-range-fields'
import { EditorSection } from '../form/editor-section'
import { FormField } from '../form/form-field'
import { ItemCard } from '../form/item-card'

export const EducationSection = () => {
  const { control } = useFormContext<DocumentFormValues>()
  const education = useFieldArray({ control, name: 'education' })

  return (
    <EditorSection title="Education">
      {education.fields.map((field, i) => (
        <ItemCard key={field.id} onRemove={() => education.remove(i)}>
          <FormField name={`education.${i}.institution`} label="Institution" />
          <FormField name={`education.${i}.degree`} label="Degree" />
          <FormField
            name={`education.${i}.fieldOfStudy`}
            label="Field of study"
          />
          <DateRangeFields name={`education.${i}`} />
        </ItemCard>
      ))}
      <AddButton
        label="Add education"
        disabled={education.fields.length >= CV_LIMITS.LIST_ITEMS}
        onClick={() => education.append(emptyEducation())}
      />
    </EditorSection>
  )
}
