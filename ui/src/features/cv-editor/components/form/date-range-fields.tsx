import type { Path } from 'react-hook-form'
import type { DocumentFormValues } from '../../utils/document-form'
import { FormField } from './form-field'

export const DateRangeFields = ({
  name,
}: {
  name: `experience.${number}` | `education.${number}`
}) => (
  <div className="grid grid-cols-2 gap-3">
    <FormField
      name={`${name}.startDate` as Path<DocumentFormValues>}
      label="Start"
      placeholder="YYYY-MM"
    />
    <FormField
      name={`${name}.endDate` as Path<DocumentFormValues>}
      label="End"
      placeholder="YYYY-MM or present"
    />
  </div>
)
