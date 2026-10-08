import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import type { DocumentFormValues } from '../../utils/document-form'
import { emptyBullet } from '../../utils/empty-items'
import { AddButton } from '../form/add-button'

export const BulletsField = ({ index }: { index: number }) => {
  const { register, control } = useFormContext<DocumentFormValues>()
  const bullets = useFieldArray({
    control,
    name: `experience.${index}.bullets`,
  })

  return (
    <>
      {bullets.fields.map((bullet, i) => (
        <div key={bullet.id} className="flex items-start gap-2">
          <Textarea
            rows={2}
            aria-label={`Bullet ${i + 1}`}
            {...register(`experience.${index}.bullets.${i}.text`)}
          />
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
        onClick={() => bullets.append(emptyBullet())}
      />
    </>
  )
}
