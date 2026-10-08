import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { CV_LIMITS } from '@/entities/cv'
import { Button } from '@/shared/ui/button'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyBullet } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'
import { FormField } from '../form/form-field'

export const BulletsField = ({ index }: { index: number }) => {
  const { control } = useFormContext<DocumentFormValues>()
  const bullets = useFieldArray({
    control,
    name: `experience.${index}.bullets`,
  })

  return (
    <>
      {bullets.fields.map((bullet, i) => (
        <div key={bullet.id} className="flex items-start gap-2">
          <div className="flex-1">
            <FormField
              name={`experience.${index}.bullets.${i}.text`}
              ariaLabel={`Bullet ${i + 1}`}
              multiline
              rows={2}
              max={CV_LIMITS.BULLET}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove bullet"
            onClick={() => bullets.remove(i)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <AddButton
        label="Add bullet"
        disabled={bullets.fields.length >= CV_LIMITS.LIST_ITEMS}
        onClick={() => bullets.append(emptyBullet())}
      />
    </>
  )
}
