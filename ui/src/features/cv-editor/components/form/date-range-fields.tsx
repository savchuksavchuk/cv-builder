import { get, useFormContext } from 'react-hook-form'
import { Input } from '@/shared/ui/input'
import type { DocumentFormValues } from '../../utils/document-form'
import { Field } from './field'

export const DateRangeFields = ({
  name,
}: {
  name: `experience.${number}` | `education.${number}`
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<DocumentFormValues>()

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Start" error={get(errors, `${name}.startDate`)?.message}>
        <Input placeholder="YYYY-MM" {...register(`${name}.startDate`)} />
      </Field>
      <Field label="End" error={get(errors, `${name}.endDate`)?.message}>
        <Input
          placeholder="YYYY-MM or present"
          {...register(`${name}.endDate`)}
        />
      </Field>
    </div>
  )
}
