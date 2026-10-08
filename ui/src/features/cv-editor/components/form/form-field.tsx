import { get, useFormContext, useWatch, type Path } from 'react-hook-form'
import { CharCounter } from '@/shared/ui/char-counter'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import type { DocumentFormValues } from '../../utils/document-form'
import { Field } from './field'

export const FormField = ({
  name,
  label,
  ariaLabel,
  placeholder,
  multiline = false,
  rows,
  max,
}: {
  name: Path<DocumentFormValues>
  label?: string
  ariaLabel?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  max?: number
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<DocumentFormValues>()
  const value = useWatch({ control, name })
  const error: string | undefined = get(errors, name)?.message
  const props = {
    placeholder,
    'aria-label': ariaLabel,
    'aria-invalid': !!error,
    ...register(name),
  }

  return (
    <Field label={label} error={error}>
      {multiline ? <Textarea rows={rows} {...props} /> : <Input {...props} />}
      {max !== undefined && (
        <CharCounter length={String(value ?? '').length} max={max} />
      )}
    </Field>
  )
}
