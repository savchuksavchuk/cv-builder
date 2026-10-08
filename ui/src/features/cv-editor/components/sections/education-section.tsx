import { useFieldArray, useFormContext } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyEducation } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { DateRangeFields } from '../form/date-range-fields'
import { EditorSection } from '../form/editor-section'
import { Field } from '../form/field'
import { ItemCard } from '../form/item-card'

export const EducationSection = () => {
  const { register, control } = useFormContext<DocumentFormValues>()
  const education = useFieldArray({ control, name: 'education' })

  return (
    <EditorSection title="Education">
      {education.fields.map((field, i) => (
        <ItemCard key={field.id} onRemove={() => education.remove(i)}>
          <Field label="Institution">
            <Input {...register(`education.${i}.institution`)} />
          </Field>
          <Field label="Degree">
            <Input {...register(`education.${i}.degree`)} />
          </Field>
          <Field label="Field of study">
            <Input {...register(`education.${i}.fieldOfStudy`)} />
          </Field>
          <DateRangeFields name={`education.${i}`} />
        </ItemCard>
      ))}
      <AddButton
        label="Add education"
        onClick={() => education.append(emptyEducation())}
      />
    </EditorSection>
  )
}
