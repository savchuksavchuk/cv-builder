import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

export const ItemCard = ({
  onRemove,
  children,
}: {
  onRemove: () => void
  children: ReactNode
}) => (
  <div className="grid gap-3 rounded-lg border p-4">
    {children}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="justify-self-end"
      onClick={onRemove}
    >
      <Trash2 /> Remove
    </Button>
  </div>
)
