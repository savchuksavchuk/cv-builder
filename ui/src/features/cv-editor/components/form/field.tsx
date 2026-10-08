import type { ReactNode } from 'react'
import { Label } from '@/shared/ui/label'

export const Field = ({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) => (
  <Label className="flex-col items-stretch gap-2">
    {label}
    {children}
    {error && (
      <span className="text-destructive text-sm font-normal">{error}</span>
    )}
  </Label>
)
