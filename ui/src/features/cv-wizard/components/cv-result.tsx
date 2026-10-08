import { useState } from 'react'
import type { Cv } from '@/entities/cv'
import { CvEditor } from '@/features/cv-editor'
import { Button } from '@/shared/ui/button'
import { useUpdateCv } from '../hooks/use-update-cv'
import { CvPreview } from './cv-preview'

export const CvResult = ({ cv }: { cv: Cv }) => {
  const [editing, setEditing] = useState(false)
  const { update, isPending, error, reset } = useUpdateCv(cv)

  if (!cv.document) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        The CV has no content
      </p>
    )
  }

  if (editing) {
    return (
      <CvEditor
        document={cv.document}
        isSaving={isPending}
        error={error}
        onSave={(document) =>
          update(document, { onSuccess: () => setEditing(false) })
        }
        onCancel={() => {
          reset()
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <CvPreview document={cv.document} />
    </div>
  )
}
