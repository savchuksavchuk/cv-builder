import { useState } from 'react'
import type { Cv } from '@/entities/cv'
import { Button } from '@/shared/ui/button'
import { CvEditor } from '@/features/cv-editor'
import { CvPreview } from './cv-preview'

export const CvResult = ({ cv }: { cv: Cv }) => {
  const [document, setDocument] = useState(cv.document)
  const [editing, setEditing] = useState(false)

  if (!document) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        The CV has no content
      </p>
    )
  }

  if (editing) {
    return (
      <CvEditor
        document={document}
        onSave={(next) => {
          setDocument(next)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Edits are kept only until you leave this page.
        </p>
        <Button variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <CvPreview document={document} />
    </div>
  )
}
