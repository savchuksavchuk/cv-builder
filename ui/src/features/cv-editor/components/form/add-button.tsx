import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export const AddButton = ({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) => (
  <Button type="button" variant="outline" disabled={disabled} onClick={onClick}>
    <Plus /> {label}
  </Button>
)
