import { useFormContext } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import type { DocumentFormValues } from '../../utils/document-form'
import { DateRangeFields } from '../form/date-range-fields'
import { Field } from '../form/field'
import { ItemCard } from '../form/item-card'
import { BulletsField } from './bullets-field'

export const ExperienceItem = ({
  index,
  onRemove,
}: {
  index: number
  onRemove: () => void
}) => {
  const { register } = useFormContext<DocumentFormValues>()

  return (
    <ItemCard onRemove={onRemove}>
      <Field label="Title">
        <Input {...register(`experience.${index}.title`)} />
      </Field>
      <Field label="Company">
        <Input {...register(`experience.${index}.company`)} />
      </Field>
      <Field label="Location">
        <Input {...register(`experience.${index}.location`)} />
      </Field>
      <DateRangeFields name={`experience.${index}`} />
      <BulletsField index={index} />
    </ItemCard>
  )
}
