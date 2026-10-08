import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export const AddButton = ({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) => (
  <Button type="button" variant="outline" onClick={onClick}>
    <Plus /> {label}
  </Button>
)
