import { useFieldArray, useFormContext } from 'react-hook-form'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyExperience } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { EditorSection } from '../form/editor-section'
import { ExperienceItem } from './experience-item'

export const ExperienceSection = () => {
  const { control } = useFormContext<DocumentFormValues>()
  const experience = useFieldArray({ control, name: 'experience' })

  return (
    <EditorSection title="Experience">
      {experience.fields.map((field, i) => (
        <ExperienceItem
          key={field.id}
          index={i}
          onRemove={() => experience.remove(i)}
        />
      ))}
      <AddButton
        label="Add experience"
        onClick={() => experience.append(emptyExperience())}
      />
    </EditorSection>
  )
}
