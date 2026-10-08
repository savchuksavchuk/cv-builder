import { DateRangeFields } from '../form/date-range-fields'
import { FormField } from '../form/form-field'
import { ItemCard } from '../form/item-card'
import { BulletsField } from './bullets-field'

export const ExperienceItem = ({
  index,
  onRemove,
}: {
  index: number
  onRemove: () => void
}) => (
  <ItemCard onRemove={onRemove}>
    <FormField name={`experience.${index}.title`} label="Title" />
    <FormField name={`experience.${index}.company`} label="Company" />
    <FormField name={`experience.${index}.location`} label="Location" />
    <DateRangeFields name={`experience.${index}`} />
    <BulletsField index={index} />
  </ItemCard>
)
